import prisma from '../lib/db.js';
import { io } from '../lib/socket.js';

export const joinInterestRoom = async (req, res) => {
    try {
        const { topic, skipRoomId } = req.body; // e.g., "Coding", "Business", "Teaching"
        const userId = req.user.id;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        // Find active rooms for this topic
        let rooms = await prisma.interestRoom.findMany({
            where: {
                topic,
                expiresAt: { gt: new Date() }, // Still active
                ...(skipRoomId ? { id: { not: skipRoomId } } : {})
            },
            orderBy: { createdAt: 'desc' },
            include: { members: true }
        });

        // Find a room with capacity < 10
        let room = rooms.find(r => r.members.length < 10);

        if (!room) {
            // Create a new room with 1 hour expiry
            room = await prisma.interestRoom.create({
                data: {
                    topic,
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
                }
            });
        }

        // Add user to room if not already in it
        const existingMember = await prisma.interestRoomMember.findUnique({
            where: {
                userId_roomId: { userId, roomId: room.id }
            }
        });

        if (!existingMember) {
            await prisma.interestRoomMember.create({
                data: { userId, roomId: room.id }
            });
        }

        res.status(200).json({ roomId: room.id, topic: room.topic, expiresAt: room.expiresAt });

    } catch (error) {
        console.error('Error in joinInterestRoom:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getInterestRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        // Verify membership
        const isMember = await prisma.interestRoomMember.findUnique({
            where: {
                userId_roomId: { userId, roomId }
            }
        });

        if (!isMember) {
            return res.status(403).json({ error: 'You are not in this interest room' });
        }

        const messages = await prisma.message.findMany({
            where: { roomId, roomType: 'INTEREST' },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json(messages);
    } catch (err) {
        console.error('Error fetching interest messages:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendInterestMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { roomId } = req.params;
        const senderId = req.user.id;

        if (!text) return res.status(400).json({ error: 'Text required' });

        // Verify membership
        const isMember = await prisma.interestRoomMember.findUnique({
            where: {
                userId_roomId: { userId: senderId, roomId }
            }
        });

        if (!isMember) {
            return res.status(403).json({ error: 'Not in this room' });
        }

        const newMessage = await prisma.message.create({
            data: {
                senderId,
                roomId,
                content: text,
                roomType: 'INTEREST',
            }
        });

        // Emit to room
        io.to(`interest_${roomId}`).emit('newInterestMessage', newMessage);

        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Error sending interest message:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
