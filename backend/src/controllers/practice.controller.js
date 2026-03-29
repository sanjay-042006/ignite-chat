import prisma from '../lib/db.js';
import { correctGrammar } from '../services/ai.service.js';
import { getReceiverSocketId } from '../lib/socket.js';
import { io } from '../lib/socket.js';

// Practice matchmaking queue
const practiceQueue = [];

export const handlePracticeSockets = (socket, io) => {
    socket.on('joinPracticeQueue', () => {
        try {
            const user = socket.user;

            if (practiceQueue.find(u => u.id === user.id)) return;

            if (practiceQueue.length > 0) {
                const matchedUser = practiceQueue.shift();

                // Join both to a common room string "practice_${matchedUser.id}_${user.id}"
                const roomId = `practice_${matchedUser.id}_${user.id}`;

                socket.join(roomId);

                // Notify user2 (current socket)
                io.to(socket.id).emit('practiceMatch', { roomId, partnerId: matchedUser.id, partnerUsername: matchedUser.username });

                // Notify user1 (matched socket)
                const user1SocketIds = getReceiverSocketId(matchedUser.id);
                user1SocketIds.forEach(socketId => {
                    io.to(socketId).emit('practiceMatchDirect', { targetUserId: matchedUser.id, roomId, partnerId: user.id, partnerUsername: user.username });
                });

            } else {
                practiceQueue.push(user);
                socket.emit('practiceQueueStatus', { state: 'waiting' });
            }
        } catch (error) {
            console.error('Error in joinPracticeQueue:', error);
        }
    });

    socket.on('leavePracticeQueue', () => {
        const index = practiceQueue.findIndex(u => u.id === socket.user.id);
        if (index !== -1) {
            practiceQueue.splice(index, 1);
        }
    });

    socket.on('disconnect', () => {
        const index = practiceQueue.findIndex(u => u.id === socket.user?.id);
        if (index !== -1) {
            practiceQueue.splice(index, 1);
        }
    });

    socket.on('joinPracticeRoom', (roomId) => {
        socket.join(roomId);
    });

    socket.on('leavePracticeRoom', (currentRoomId) => {
        if (currentRoomId) {
            socket.to(currentRoomId).emit('partnerLeft');
            socket.leave(currentRoomId);
        }
    });

    socket.on('nextPractice', (currentRoomId) => {
        if (currentRoomId) {
            socket.to(currentRoomId).emit('partnerLeft');
            socket.leave(currentRoomId);
        }
    });
};

export const sendPracticeMessage = async (req, res) => {
    try {
        const { text, receiverId } = req.body; // In practice mode, partner is known via receiverId
        const { roomId } = req.params;
        const senderId = req.user.id;

        if (!text) return res.status(400).json({ error: 'Text required' });

        // Step 1: Request AI correction
        let correctedText = await correctGrammar(text);

        // Step 2: Store Both versions in db via EnglishPracticeSession map
        const sessionRecord = await prisma.englishPracticeSession.create({
            data: {
                originalText: text,
                correctedText,
                senderId,
                receiverId
            }
        });

        // Create standard message mapping to this session ID
        const newMessage = await prisma.message.create({
            data: {
                senderId,
                roomId,
                content: JSON.stringify({
                    original: text,
                    corrected: correctedText
                }),
                roomType: 'PRACTICE'
            }
        });

        // Propagate to room
        io.to(roomId).emit('newPracticeMessage', newMessage);

        res.status(201).json(newMessage);

    } catch (err) {
        console.error('Error sending practice message:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPracticeMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        const messages = await prisma.message.findMany({
            where: { roomId, roomType: 'PRACTICE' },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json(messages);
    } catch (err) {
        console.error('Error fetching practice messages:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
