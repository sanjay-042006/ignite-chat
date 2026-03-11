import prisma from '../lib/db.js';
import { io } from '../lib/socket.js';
import { evaluateGroupStory } from '../services/ai.service.js';

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
                    include: { user: { select: { username: true } } }
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
                    include: { entries: { orderBy: { dayNumber: 'asc' }, include: { user: { select: { username: true } } } } }
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
            include: { entries: true }
        });

        if (!group || group.status !== 'ACTIVE') {
            return res.status(400).json({ error: "Active story group not found" });
        }

        const isMember = await prisma.storyGroupMember.findUnique({
            where: { userId_groupId: { userId, groupId: id } }
        });

        if (!isMember) {
            return res.status(403).json({ error: "You are not part of this story group" });
        }

        // Check turn rotation (User must wait for 4 other people)
        if (group.entries.length > 0) {
            // Get up to the last 4 entries
            const lastEntries = group.entries.slice(-4);

            // If the user's ID exists in any of the last 4 entries, they can't write yet
            const userAlreadyWroteRecently = lastEntries.some(e => e.userId === userId);

            if (userAlreadyWroteRecently) {
                return res.status(400).json({ error: "It's not your turn yet! You must wait for the other 4 members to contribute." });
            }

            // Check if there was already an entry today (UTC)
            const lastEntry = group.entries[group.entries.length - 1];
            const lastEntryDate = new Date(lastEntry.createdAt);
            const today = new Date();

            if (lastEntryDate.getUTCFullYear() === today.getUTCFullYear() &&
                lastEntryDate.getUTCMonth() === today.getUTCMonth() &&
                lastEntryDate.getUTCDate() === today.getUTCDate()) {
                return res.status(400).json({ error: "Only one entry can be added per day. Please wait until tomorrow." });
            }
        }

        const dayNumber = group.entries.length + 1;

        if (dayNumber > 30) {
            return res.status(400).json({ error: "Story reaches max 30 days" });
        }

        const entry = await prisma.storyEntry.create({
            data: {
                content,
                dayNumber,
                groupId: id,
                userId
            },
            include: { user: { select: { username: true } } }
        });

        io.to(`story_${id}`).emit('newStoryEntry', entry);

        // Check if story is now complete (Day 30)
        if (dayNumber === 30) {
            await prisma.storyGroup.update({
                where: { id },
                data: { status: 'EVALUATING' }
            });

            // Trigger AI evaluation asynchronously
            evaluateGroupStory(id).catch(err => console.error("AI Eval failed", err));

            io.to(`story_${id}`).emit('story_completed', { groupId: id });
        }

        res.status(201).json(entry);
    } catch (error) {
        console.error("Error in contributeToStory", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
