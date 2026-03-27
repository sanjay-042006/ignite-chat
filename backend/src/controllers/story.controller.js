import prisma from '../lib/db.js';
import { io } from '../lib/socket.js';

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
