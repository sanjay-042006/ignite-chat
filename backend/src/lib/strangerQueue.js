import prisma from './db.js';
import { getReceiverSocketId } from './socket.js';

// In-memory queue for matchmaking: stores user objects
const strangerQueue = [];

export const handleStrangerSockets = (socket, io) => {
    socket.on('joinStrangerQueue', async () => {
        try {
            const user = socket.user;

            // Check if user is already in queue to prevent duplicates
            if (strangerQueue.find(u => u.id === user.id)) {
                return;
            }

            // If queue has someone else
            if (strangerQueue.length > 0) {
                const matchedUser = strangerQueue.shift();

                // Generate new StrangerRoom entry
                const room = await prisma.strangerRoom.create({
                    data: {
                        user1Id: matchedUser.id,
                        user2Id: user.id,
                    }
                });

                // Join both sockets to this random room string
                const roomName = `stranger_${room.id}`;

                // Notify user2 (the one triggering)
                io.to(socket.id).emit('strangerMatch', { roomId: room.id, targetUserId: matchedUser.id, targetUsername: matchedUser.username, role: 'user2' });

                // Notify user1 (the one waiting in queue)
                const user1SocketIds = getReceiverSocketId(matchedUser.id);
                user1SocketIds.forEach(socketId => {
                    io.to(socketId).emit('strangerMatch', { roomId: room.id, targetUserId: user.id, targetUsername: user.username, role: 'user1' });
                });
            } else {
                strangerQueue.push(user);
                socket.emit('strangerQueueStatus', { state: 'waiting' });
            }

        } catch (error) {
            console.error('Error in joinStrangerQueue:', error);
            socket.emit('error', 'Matchmaking failed');
        }
    });

    socket.on('leaveStrangerQueue', () => {
        const index = strangerQueue.findIndex(u => u.id === socket.user.id);
        if (index !== -1) {
            strangerQueue.splice(index, 1);
        }
    });

    socket.on('leaveStrangerRoom', async (currentRoomId) => {
        try {
            if (currentRoomId) {
                await prisma.strangerRoom.update({
                    where: { id: currentRoomId },
                    data: { isActive: false }
                });
                socket.to(`stranger_${currentRoomId}`).emit('partnerLeft');
                socket.leave(`stranger_${currentRoomId}`);
            }
        } catch (e) {
            console.error('Error on leaveStrangerRoom:', e.message);
        }
    });

    socket.on('nextStranger', async (currentRoomId) => {
        try {
            // Deactivate old room
            if (currentRoomId) {
                await prisma.strangerRoom.update({
                    where: { id: currentRoomId },
                    data: { isActive: false }
                });
                // Tell other person room is closed
                socket.to(`stranger_${currentRoomId}`).emit('partnerLeft');
                socket.leave(`stranger_${currentRoomId}`);
            }
        } catch (e) {
            console.error('Error on nextStranger:', e.message);
        }
    });

    // Identity reveal — user voluntarily shares their name with partner
    socket.on('revealIdentity', (roomId) => {
        const user = socket.user;
        if (!roomId || !user) return;
        // Send to everyone else in the room (the partner)
        socket.to(`stranger_${roomId}`).emit('partnerRevealed', {
            username: user.username
        });
    });
};
