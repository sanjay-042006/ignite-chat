import prisma from '../lib/db.js';
import { io } from '../lib/socket.js';

// Random names generator
const generateAlias = () => {
    const adjectives = ['Shadow', 'Mystic', 'Phantom', 'Ghost', 'Silent', 'Hidden', 'Dark', 'Neon', 'Cosmic'];
    const nums = Math.floor(Math.random() * 900) + 100; // 100-999
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${adj}${nums}`;
};

export const enableAnonymousMode = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { durationMinutes } = req.body; // e.g., 10, 30
        const adminId = req.user.id;

        // Verify admin
        const member = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: adminId,
                    groupId
                }
            }
        });

        if (!member || !member.isAdmin) {
            return res.status(403).json({ error: 'Only group admins can enable Anonymous Mode' });
        }

        const expiresAt = new Date(Date.now() + durationMinutes * 60000);

        // Fetch all members of this group
        const groupMembers = await prisma.groupMember.findMany({
            where: { groupId }
        });

        const activeSessions = [];

        // Generate and upsert anonymous sessions for all members
        for (const m of groupMembers) {
            const session = await prisma.anonymousSession.upsert({
                where: { userId: m.userId },
                update: {
                    alias: generateAlias(),
                    isActive: true,
                    expiresAt
                },
                create: {
                    userId: m.userId,
                    alias: generateAlias(),
                    isActive: true,
                    expiresAt
                }
            });
            activeSessions.push(session);
        }

        // Notify room that anonymous mode is ON
        io.to(groupId).emit('anonymousModeToggled', {
            isActive: true,
            expiresAt,
            groupId
        });

        res.status(200).json({ message: 'Anonymous mode enabled', expiresAt, activeSessions });
    } catch (error) {
        console.error('Error enabling anonymous mode:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAnonymousStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const session = await prisma.anonymousSession.findUnique({
            where: { userId }
        });

        if (session && session.isActive && new Date() < session.expiresAt) {
            return res.status(200).json({ isAnonymous: true, alias: session.alias, expiresAt: session.expiresAt });
        }

        res.status(200).json({ isAnonymous: false });
    } catch (error) {
        console.error('Error getting anonymous status:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendStrangerMessage = async (req, res) => {
    try {
        const { text, mediaUrl, mediaType } = req.body;
        const { roomId } = req.params;
        const senderId = req.user.id;

        if (!text && !mediaUrl) return res.status(400).json({ error: 'Message content or media required' });

        const newMessage = await prisma.message.create({
            data: {
                senderId,
                roomId,
                content: text || null,
                mediaUrl: mediaUrl || null,
                mediaType: mediaType || null,
                roomType: 'STRANGER'
            }
        });

        // Broadcast to the room
        io.to(`stranger_${roomId}`).emit('newStrangerMessage', newMessage);

        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Error sending stranger message:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
