import prisma from '../lib/db.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import { generateLoveAIChat } from '../services/ai.service.js';

// Send a love connection request
export const sendLoveRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { userId } = req.params;

        if (senderId === userId) {
            return res.status(400).json({ error: "You can't send a love request to yourself!" });
        }

        // EXCLUSIVITY: Check if sender already has an accepted/pending/breaking_up connection
        const senderActive = await prisma.loveConnection.findFirst({
            where: {
                OR: [{ senderId }, { receiverId: senderId }],
                status: { in: ['ACCEPTED', 'BREAKING_UP'] }
            }
        });
        if (senderActive) {
            return res.status(400).json({ error: "You already have a love connection! 💕" });
        }

        // EXCLUSIVITY: Check if receiver already has an accepted/breaking_up connection
        const receiverActive = await prisma.loveConnection.findFirst({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
                status: { in: ['ACCEPTED', 'BREAKING_UP'] }
            }
        });
        if (receiverActive) {
            return res.status(400).json({ error: "This person already has a love connection." });
        }

        // Check existing request between these two
        const existing = await prisma.loveConnection.findFirst({
            where: {
                OR: [
                    { senderId, receiverId: userId },
                    { senderId: userId, receiverId: senderId }
                ],
                status: 'PENDING'
            }
        });
        if (existing) {
            return res.status(400).json({ error: "Request already pending." });
        }

        const connection = await prisma.loveConnection.create({
            data: { senderId, receiverId: userId },
            include: { sender: { select: { id: true, username: true } } }
        });

        const receiverSockets = getReceiverSocketId(userId);
        if (receiverSockets?.length > 0) {
            receiverSockets.forEach(sid => {
                io.to(sid).emit('newLoveRequest', connection);
            });
        }

        res.status(201).json(connection);
    } catch (error) {
        console.error('sendLoveRequest:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Accept a love connection request
export const acceptLoveRequest = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const myId = req.user.id;

        const conn = await prisma.loveConnection.findUnique({ where: { id: connectionId } });
        if (!conn || conn.receiverId !== myId) {
            return res.status(404).json({ error: "Connection request not found." });
        }
        if (conn.status !== 'PENDING') {
            return res.status(400).json({ error: "Request is not pending." });
        }

        // EXCLUSIVITY: Check both users don't have other accepted connections
        const anyActive = await prisma.loveConnection.findFirst({
            where: {
                OR: [
                    { senderId: myId, status: { in: ['ACCEPTED', 'BREAKING_UP'] } },
                    { receiverId: myId, status: { in: ['ACCEPTED', 'BREAKING_UP'] } },
                    { senderId: conn.senderId, status: { in: ['ACCEPTED', 'BREAKING_UP'] } },
                    { receiverId: conn.senderId, status: { in: ['ACCEPTED', 'BREAKING_UP'] } },
                ]
            }
        });
        if (anyActive) {
            return res.status(400).json({ error: "One of you already has a love connection." });
        }

        const updated = await prisma.loveConnection.update({
            where: { id: connectionId },
            data: { status: 'ACCEPTED' },
            include: {
                sender: { select: { id: true, username: true } },
                receiver: { select: { id: true, username: true } }
            }
        });

        const senderSockets = getReceiverSocketId(conn.senderId);
        if (senderSockets?.length > 0) {
            senderSockets.forEach(sid => {
                io.to(sid).emit('loveRequestAccepted', updated);
            });
        }

        res.status(200).json(updated);
    } catch (error) {
        console.error('acceptLoveRequest:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Reject a love connection request
export const rejectLoveRequest = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const myId = req.user.id;

        const conn = await prisma.loveConnection.findUnique({ where: { id: connectionId } });
        if (!conn || conn.receiverId !== myId) {
            return res.status(404).json({ error: "Request not found." });
        }

        await prisma.loveConnection.update({
            where: { id: connectionId },
            data: { status: 'REJECTED' }
        });

        res.status(200).json({ message: "Rejected" });
    } catch (error) {
        console.error('rejectLoveRequest:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all my love connections
export const getConnections = async (req, res) => {
    try {
        const myId = req.user.id;

        const connections = await prisma.loveConnection.findMany({
            where: {
                OR: [{ senderId: myId }, { receiverId: myId }],
                status: { in: ['PENDING', 'ACCEPTED', 'BREAKING_UP'] }
            },
            include: {
                sender: { select: { id: true, username: true, email: true } },
                receiver: { select: { id: true, username: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mapped = await Promise.all(connections.map(async (c) => {
            const partner = c.senderId === myId ? c.receiver : c.sender;
            const direction = c.senderId === myId ? 'SENT' : 'RECEIVED';
            
            const unreadCount = await prisma.loveMessage.count({
                where: {
                    connectionId: c.id,
                    senderId: { not: myId },
                    isRead: false
                }
            });

            return {
                id: c.id,
                partner,
                status: c.status,
                direction,
                breakupInitiatedBy: c.breakupInitiatedBy,
                breakupInitiatedAt: c.breakupInitiatedAt,
                createdAt: c.createdAt,
                unreadCount
            };
        }));

        res.status(200).json(mapped);
    } catch (error) {
        console.error('getConnections:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get messages for a love connection
export const getLoveMessages = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const myId = req.user.id;

        const conn = await prisma.loveConnection.findUnique({ where: { id: connectionId } });
        if (!conn || (conn.senderId !== myId && conn.receiverId !== myId)) {
            return res.status(403).json({ error: "Not part of this connection." });
        }
        if (conn.status !== 'ACCEPTED' && conn.status !== 'BREAKING_UP') {
            return res.status(400).json({ error: "Connection not active." });
        }

        const messages = await prisma.loveMessage.findMany({
            where: { connectionId },
            include: { sender: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error('getLoveMessages:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Send a normal love message
export const sendLoveMessage = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { text, mediaUrl, mediaType } = req.body;
        const senderId = req.user.id;

        if (!text?.trim() && !mediaUrl) {
            return res.status(400).json({ error: "Message content or media is required." });
        }

        const conn = await prisma.loveConnection.findUnique({ where: { id: connectionId } });
        if (!conn || (conn.senderId !== senderId && conn.receiverId !== senderId)) {
            return res.status(403).json({ error: "Not part of this connection." });
        }
        if (conn.status !== 'ACCEPTED' && conn.status !== 'BREAKING_UP') {
            return res.status(400).json({ error: "Connection not active." });
        }

        const message = await prisma.loveMessage.create({
            data: { 
                connectionId, 
                senderId, 
                content: text?.trim() || null,
                mediaUrl: mediaUrl || null,
                mediaType: mediaType || null 
            },
            include: { sender: { select: { id: true, username: true } } }
        });

        const roomName = `love_${connectionId}`;
        io.to(roomName).emit('newLoveMessage', message);

        res.status(201).json(message);
    } catch (error) {
        console.error('sendLoveMessage:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Initiate breakup (starts 5-day cooldown)
export const initiateBreakup = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const myId = req.user.id;

        const conn = await prisma.loveConnection.findUnique({ where: { id: connectionId } });
        if (!conn || (conn.senderId !== myId && conn.receiverId !== myId)) {
            return res.status(403).json({ error: "Not part of this connection." });
        }
        if (conn.status !== 'ACCEPTED') {
            return res.status(400).json({ error: "Connection is not active." });
        }

        const updated = await prisma.loveConnection.update({
            where: { id: connectionId },
            data: {
                status: 'BREAKING_UP',
                breakupInitiatedBy: myId,
                breakupInitiatedAt: new Date()
            },
            include: {
                sender: { select: { id: true, username: true } },
                receiver: { select: { id: true, username: true } }
            }
        });

        const partnerId = conn.senderId === myId ? conn.receiverId : conn.senderId;
        const roomName = `love_${connectionId}`;
        io.to(roomName).emit('breakupInitiated', {
            connectionId,
            initiatedBy: myId,
            initiatedAt: updated.breakupInitiatedAt
        });

        res.status(200).json({ message: "Breakup initiated. Your partner has 5 days to convince you. 💔" });
    } catch (error) {
        console.error('initiateBreakup:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Accept breakup (both agree — immediate breakup)
export const acceptBreakup = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const myId = req.user.id;

        const conn = await prisma.loveConnection.findUnique({ where: { id: connectionId } });
        if (!conn || (conn.senderId !== myId && conn.receiverId !== myId)) {
            return res.status(403).json({ error: "Not part of this connection." });
        }
        if (conn.status !== 'BREAKING_UP') {
            return res.status(400).json({ error: "No breakup in progress." });
        }
        // Only the partner (not initiator) can accept breakup
        if (conn.breakupInitiatedBy === myId) {
            return res.status(400).json({ error: "You initiated the breakup. Wait for your partner's response." });
        }

        // Delete messages and the connection
        await prisma.loveMessage.deleteMany({ where: { connectionId } });
        await prisma.loveConnection.delete({ where: { id: connectionId } });

        const roomName = `love_${connectionId}`;
        io.to(roomName).emit('breakupCompleted', { connectionId });

        res.status(200).json({ message: "Connection ended. 💔" });
    } catch (error) {
        console.error('acceptBreakup:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Cancel breakup (initiator changes their mind)
export const cancelBreakup = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const myId = req.user.id;

        const conn = await prisma.loveConnection.findUnique({ where: { id: connectionId } });
        if (!conn || (conn.senderId !== myId && conn.receiverId !== myId)) {
            return res.status(403).json({ error: "Not part of this connection." });
        }
        if (conn.status !== 'BREAKING_UP') {
            return res.status(400).json({ error: "No breakup in progress." });
        }
        if (conn.breakupInitiatedBy !== myId) {
            return res.status(400).json({ error: "Only the person who initiated can cancel." });
        }

        const updated = await prisma.loveConnection.update({
            where: { id: connectionId },
            data: {
                status: 'ACCEPTED',
                breakupInitiatedBy: null,
                breakupInitiatedAt: null
            }
        });

        const roomName = `love_${connectionId}`;
        io.to(roomName).emit('breakupCancelled', { connectionId });

        res.status(200).json({ message: "Breakup cancelled! Love wins! ❤️" });
    } catch (error) {
        console.error('cancelBreakup:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Trigger AI Chat mode (1 minute)
export const triggerAIChat = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const myId = req.user.id;

        const conn = await prisma.loveConnection.findUnique({
            where: { id: connectionId },
            include: {
                sender: { select: { id: true, username: true } },
                receiver: { select: { id: true, username: true } }
            }
        });

        if (!conn || (conn.senderId !== myId && conn.receiverId !== myId)) {
            return res.status(403).json({ error: "Not part of this connection." });
        }
        if (conn.status !== 'ACCEPTED' && conn.status !== 'BREAKING_UP') {
            return res.status(400).json({ error: "Connection not active." });
        }

        const recentMessages = await prisma.loveMessage.findMany({
            where: { connectionId, isAI: false },
            include: { sender: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        recentMessages.reverse();

        const user1 = conn.sender;
        const user2 = conn.receiver;
        const roomName = `love_${connectionId}`;

        io.to(roomName).emit('aiChatStarted', { connectionId, duration: 60 });
        res.status(200).json({ message: "AI Chat started! ✨" });

        const aiMessages = await generateLoveAIChat(recentMessages, user1, user2);
        const interval = Math.floor(60000 / aiMessages.length);

        for (let i = 0; i < aiMessages.length; i++) {
            await new Promise(resolve => setTimeout(resolve, interval));

            const msg = aiMessages[i];
            const saved = await prisma.loveMessage.create({
                data: {
                    connectionId,
                    senderId: msg.sendAs,
                    content: msg.content,
                    isAI: true
                },
                include: { sender: { select: { id: true, username: true } } }
            });

            io.to(roomName).emit('newLoveMessage', saved);
        }

        io.to(roomName).emit('aiChatEnded', { connectionId });

    } catch (error) {
        console.error('triggerAIChat:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const markLoveMessagesAsSeen = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const myId = req.user.id;

        await prisma.loveMessage.updateMany({
            where: {
                connectionId: connectionId,
                senderId: { not: myId },
                isRead: false
            },
            data: { isRead: true }
        });

        const roomName = `love_${connectionId}`;
        io.to(roomName).emit('loveMessagesSeen', { connectionId, byUserId: myId });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('markLoveMessagesAsSeen:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};
