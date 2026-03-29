import prisma from './db.js';
import { getReceiverSocketId } from './socket.js';
import { evaluateGroupStory } from '../services/ai.service.js';

const storyQueue = []; // Users waiting for a new story group

// ===== PRODUCTION CONFIG =====
const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const GROUP_SIZE = 5; // Number of users to form a group
// =============================

const GENRES = ["Science Fiction", "Fantasy", "Mystery", "Horror", "Romance", "Adventure", "Historical Fiction", "Thriller"];

// Track active timers so we can clean up if needed
const activeTimers = new Map();

const startAutoCompleteTimer = (groupId, io) => {
    console.log(`[Story] Auto-complete timer started for group ${groupId} — will complete in ${STORY_DURATION_MS / 1000}s`);

    const timer = setTimeout(async () => {
        try {
            // Check if the group is still active (might have been completed manually)
            const group = await prisma.storyGroup.findUnique({
                where: { id: groupId }
            });

            if (!group || group.status !== 'ACTIVE') {
                console.log(`[Story] Group ${groupId} already ${group?.status || 'deleted'}, skipping auto-complete`);
                activeTimers.delete(groupId);
                return;
            }

            console.log(`[Story] Auto-completing group ${groupId} after 24 hours`);

            // Set to EVALUATING
            await prisma.storyGroup.update({
                where: { id: groupId },
                data: { status: 'EVALUATING' }
            });

            // Notify all members
            io.to(`story_${groupId}`).emit('story_completed', { groupId });

            // Trigger AI evaluation
            evaluateGroupStory(groupId).catch(err => console.error("[Story] AI Eval failed for auto-complete", err));

            activeTimers.delete(groupId);
        } catch (error) {
            console.error(`[Story] Error in auto-complete timer for group ${groupId}:`, error);
        }
    }, STORY_DURATION_MS);

    activeTimers.set(groupId, timer);
};

export const handleStorySockets = (socket, io) => {
    socket.on('joinStoryQueue', async () => {
        try {
            const user = socket.user;

            // Prevent duplicates
            if (storyQueue.find(u => u.id === user.id)) {
                return;
            }

            storyQueue.push(user);

            // Broadcast to all users in queue
            storyQueue.forEach(u => {
                const uSocketIds = getReceiverSocketId(u.id);
                uSocketIds.forEach(socketId => {
                    io.to(socketId).emit('storyQueueStatus', { state: 'waiting', queueLength: storyQueue.length });
                });
            });
            // Also emit to current socket just in case they aren't fully mapped yet
            socket.emit('storyQueueStatus', { state: 'waiting', queueLength: storyQueue.length });

            // If we have enough people, form a Story Group
            if (storyQueue.length >= GROUP_SIZE) {
                const groupMembers = storyQueue.splice(0, GROUP_SIZE);

                // Assign random genre
                const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];

                // Create the Story Group (5 minutes from now for testing)
                const endDate = new Date();
                endDate.setTime(endDate.getTime() + STORY_DURATION_MS);

                const group = await prisma.storyGroup.create({
                    data: {
                        genre: randomGenre,
                        status: 'ACTIVE',
                        endDate,
                    }
                });

                // Add members with offset timestamp to perfectly preserve queue order in PostgreSQL
                const baseTime = Date.now();
                await Promise.all(groupMembers.map((member, idx) => 
                    prisma.storyGroupMember.create({
                        data: {
                            userId: member.id,
                            groupId: group.id,
                            joinedAt: new Date(baseTime + idx * 1000) // 1 second offset each
                        }
                    })
                ));

                // Start the auto-complete timer (5 minutes)
                startAutoCompleteTimer(group.id, io);

                // Notify each user
                for (const member of groupMembers) {
                    const memberSocketIds = getReceiverSocketId(member.id);
                    memberSocketIds.forEach(socketId => {
                        io.to(socketId).emit('storyMatch', {
                            groupId: group.id,
                            genre: group.genre,
                            endDate: group.endDate
                        });
                    });
                }

                // For the person who triggered it, if their socket wasn't updated yet in userSocketMap
                socket.emit('storyMatch', {
                    groupId: group.id,
                    genre: group.genre,
                    endDate: group.endDate
                });
            }

        } catch (error) {
            console.error('Error in joinStoryQueue:', error);
            socket.emit('error', 'Story Matchmaking failed');
        }
    });

    socket.on('leaveStoryQueue', () => {
        const index = storyQueue.findIndex(u => u.id === socket.user.id);
        if (index !== -1) {
            storyQueue.splice(index, 1);
        }
    });

    socket.on('disconnect', () => {
        const index = storyQueue.findIndex(u => u.id === socket.user?.id);
        if (index !== -1) {
            storyQueue.splice(index, 1);
        }
    });

    socket.on('joinStoryGroupSocket', (groupId) => {
        socket.join(`story_${groupId}`);
    });
};
