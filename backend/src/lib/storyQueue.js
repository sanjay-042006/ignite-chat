import prisma from './db.js';
import { getReceiverSocketId } from './socket.js';

const storyQueue = []; // Users waiting for a new story group

const GENRES = ["Science Fiction", "Fantasy", "Mystery", "Horror", "Romance", "Adventure", "Historical Fiction", "Thriller"];

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

            // If we have 5 people, form a Story Group
            if (storyQueue.length >= 5) {
                const groupMembers = storyQueue.splice(0, 5); // Take 5

                // Assign random genre
                const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];

                // Create the Story Group (30 days from now)
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);

                const group = await prisma.storyGroup.create({
                    data: {
                        genre: randomGenre,
                        status: 'ACTIVE',
                        endDate,
                    }
                });

                // Add members in bulk
                await prisma.storyGroupMember.createMany({
                    data: groupMembers.map(member => ({
                        userId: member.id,
                        groupId: group.id
                    }))
                });

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

    socket.on('joinStoryGroupSocket', (groupId) => {
        socket.join(`story_${groupId}`);
    });
};
