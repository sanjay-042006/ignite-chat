import prisma from '../lib/db.js';
import { io } from '../lib/socket.js';
import { getReceiverSocketId } from '../lib/socket.js';
import { evaluateGroupStory } from '../services/ai.service.js';

const STORY_DURATION_MS = 24 * 60 * 60 * 1000;
const GENRES = ["Science Fiction", "Fantasy", "Mystery", "Horror", "Romance", "Adventure", "Historical Fiction", "Thriller"];

export const getStoryLibrary = async (req, res) => {
    try {
        const stories = await prisma.storyGroup.findMany({
            where: { status: 'COMPLETED' },
            include: {
                entries: {
                    orderBy: { dayNumber: 'asc' },
                    take: 1 // Get first entry for summary
                },
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { endDate: 'desc' }
        });

        res.status(200).json(stories);
    } catch (error) {
        console.error("Error in getStoryLibrary", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getGlobalWinner = async (req, res) => {
    try {
        const winner = await prisma.storyGroup.findFirst({
            where: { isGlobalWinner: true },
            include: {
                globalResults: true,
            },
            orderBy: { endDate: 'desc' }
        });

        res.status(200).json(winner);
    } catch (error) {
        console.error("Error in getGlobalWinner", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getStoryDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await prisma.storyGroup.findUnique({
            where: { id },
            include: {
                entries: {
                    orderBy: { dayNumber: 'asc' },
                    include: { user: { select: { id: true, username: true } } }
                },
                members: {
                    orderBy: { joinedAt: 'asc' },
                    include: { user: { select: { id: true, username: true } } }
                },
                results: {
                    include: { winnerUser: { select: { username: true } } }
                },
                globalResults: true,
            }
        });

        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        res.status(200).json(story);
    } catch (error) {
        console.error("Error in getStoryDetails", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMyActiveStory = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find if user is in an active story group
        const membership = await prisma.storyGroupMember.findFirst({
            where: {
                userId,
                group: { status: 'ACTIVE' }
            },
            include: {
                group: {
                    include: {
                        entries: {
                            orderBy: { dayNumber: 'asc' },
                            include: { user: { select: { id: true, username: true } } }
                        },
                        members: {
                            orderBy: { joinedAt: 'asc' },
                            include: { user: { select: { id: true, username: true } } }
                        }
                    }
                }
            }
        });

        if (!membership) {
            return res.status(200).json(null);
        }

        res.status(200).json(membership.group);
    } catch (error) {
        console.error("Error in getMyActiveStory", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const contributeToStory = async (req, res) => {
    try {
        const { id } = req.params; // groupId
        const { content } = req.body;
        const userId = req.user.id;

        const group = await prisma.storyGroup.findUnique({
            where: { id },
            include: {
                entries: { orderBy: { dayNumber: 'asc' } },
                members: { orderBy: { joinedAt: 'asc' } }
            }
        });

        if (!group || group.status !== 'ACTIVE') {
            return res.status(400).json({ error: "Active story group not found" });
        }

        // Check membership
        const memberIndex = group.members.findIndex(m => m.userId === userId);
        if (memberIndex === -1) {
            return res.status(403).json({ error: "You are not part of this story group" });
        }

        // Enforce strict join-order turns (round-robin)
        const currentTurnIndex = group.entries.length % group.members.length;
        const currentTurnMember = group.members[currentTurnIndex];

        if (currentTurnMember.userId !== userId) {
            const currentTurnUser = await prisma.user.findUnique({
                where: { id: currentTurnMember.userId },
                select: { username: true }
            });
            return res.status(400).json({
                error: `It's ${currentTurnUser?.username || 'another member'}'s turn to write!`
            });
        }

        const dayNumber = group.entries.length + 1;

        const entry = await prisma.storyEntry.create({
            data: {
                content,
                dayNumber,
                groupId: id,
                userId
            },
            include: { user: { select: { id: true, username: true } } }
        });

        // --- Daily Streak Tracking Logic ---
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { storyStreak: true, lastStoryDate: true }
        });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDate = currentUser?.lastStoryDate;

        if (!lastDate) {
            await prisma.user.update({
                where: { id: userId },
                data: { storyStreak: 1, lastStoryDate: now }
            });
        } else {
            const lastDateStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
            const diffDays = Math.round(Math.abs(today - lastDateStart) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { storyStreak: (currentUser.storyStreak || 0) + 1, lastStoryDate: now }
                });
            } else if (diffDays > 1) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { storyStreak: 1, lastStoryDate: now }
                });
            }
        }
        // -----------------------------------

        // Calculate and emit whose turn is next
        const nextTurnIndex = (group.entries.length + 1) % group.members.length;
        const nextTurnMember = group.members[nextTurnIndex];

        io.to(`story_${id}`).emit('newStoryEntry', {
            ...entry,
            nextTurnUserId: nextTurnMember.userId
        });

        res.status(201).json(entry);
    } catch (error) {
        console.error("Error in contributeToStory", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createFriendStory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friendIds } = req.body;

        if (!friendIds || !Array.isArray(friendIds) || friendIds.length < 1 || friendIds.length > 4) {
            return res.status(400).json({ error: "Select 1-4 friends to create a story" });
        }

        // Check if the user already has an active story
        const existingMembership = await prisma.storyGroupMember.findFirst({
            where: {
                userId,
                group: { status: 'ACTIVE' }
            }
        });
        if (existingMembership) {
            return res.status(400).json({ error: "You already have an active story. Complete it first!" });
        }

        // Verify all selected users are actual friends
        const friendships = await prisma.friendRequest.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { senderId: userId, receiverId: { in: friendIds } },
                    { senderId: { in: friendIds }, receiverId: userId }
                ]
            }
        });

        const confirmedFriendIds = new Set();
        friendships.forEach(f => {
            if (f.senderId === userId) confirmedFriendIds.add(f.receiverId);
            else confirmedFriendIds.add(f.senderId);
        });

        const invalidFriends = friendIds.filter(id => !confirmedFriendIds.has(id));
        if (invalidFriends.length > 0) {
            return res.status(400).json({ error: "Some selected users are not your friends" });
        }

        // Create the story group
        const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];
        const endDate = new Date();
        endDate.setTime(endDate.getTime() + STORY_DURATION_MS);

        const group = await prisma.storyGroup.create({
            data: {
                genre: randomGenre,
                status: 'ACTIVE',
                endDate,
            }
        });

        // Add creator first, then friends (preserving order)
        const allMemberIds = [userId, ...friendIds];
        const baseTime = Date.now();
        await Promise.all(allMemberIds.map((memberId, idx) =>
            prisma.storyGroupMember.create({
                data: {
                    userId: memberId,
                    groupId: group.id,
                    joinedAt: new Date(baseTime + idx * 1000)
                }
            })
        ));

        // Fetch full group with members for the response
        const fullGroup = await prisma.storyGroup.findUnique({
            where: { id: group.id },
            include: {
                entries: {
                    orderBy: { dayNumber: 'asc' },
                    include: { user: { select: { id: true, username: true } } }
                },
                members: {
                    orderBy: { joinedAt: 'asc' },
                    include: { user: { select: { id: true, username: true } } }
                }
            }
        });

        // Start auto-complete timer (same as stranger stories)
        // We schedule completion after STORY_DURATION_MS
        setTimeout(async () => {
            try {
                const currentGroup = await prisma.storyGroup.findUnique({
                    where: { id: group.id }
                });
                if (!currentGroup || currentGroup.status !== 'ACTIVE') return;

                await prisma.storyGroup.update({
                    where: { id: group.id },
                    data: { status: 'EVALUATING' }
                });

                io.to(`story_${group.id}`).emit('story_completed', { groupId: group.id });
                evaluateGroupStory(group.id).catch(err => console.error("[Story] AI Eval failed", err));
            } catch (err) {
                console.error("[FriendStory] Auto-complete timer error:", err);
            }
        }, STORY_DURATION_MS);

        // Notify friends via socket
        for (const friendId of friendIds) {
            const socketIds = getReceiverSocketId(friendId);
            socketIds.forEach(socketId => {
                io.to(socketId).emit('storyMatch', {
                    groupId: group.id,
                    genre: group.genre,
                    endDate: group.endDate,
                    isFriendStory: true
                });
            });
        }

        res.status(201).json(fullGroup);
    } catch (error) {
        console.error("Error in createFriendStory", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteStoryGroup = async (req, res) => {
    try {
        const { id } = req.params; // groupId
        const userId = req.user.id;

        // Fetch group with members
        const group = await prisma.storyGroup.findUnique({
            where: { id },
            include: {
                members: { orderBy: { joinedAt: 'asc' } }
            }
        });

        if (!group) {
            return res.status(404).json({ error: "Story group not found" });
        }

        // The creator is the first member who joined
        const creator = group.members[0];
        if (!creator || creator.userId !== userId) {
            return res.status(403).json({ error: "Only the group creator can delete this story" });
        }

        // Cascade delete all associated entities
        await prisma.storyEntry.deleteMany({ where: { groupId: id } });
        await prisma.storyResult.deleteMany({ where: { groupId: id } });
        await prisma.globalStoryResult.deleteMany({ where: { storyGroupId: id } });
        await prisma.storyGroupMember.deleteMany({ where: { groupId: id } });
        
        // Finally, delete the group itself
        await prisma.storyGroup.delete({ where: { id } });

        // Notify socket listeners so active participants get booted from UI
        io.to(`story_${id}`).emit('storyGroupDeleted', { groupId: id });

        res.status(200).json({ message: "Story group successfully deleted" });
    } catch (error) {
        console.error("Error in deleteStoryGroup", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
