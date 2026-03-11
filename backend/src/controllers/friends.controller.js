import prisma from '../lib/db.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

export const sendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.params;

        if (senderId === receiverId) {
            return res.status(400).json({ error: "Cannot send request to yourself." });
        }

        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: senderId, user2Id: receiverId },
                    { user1Id: receiverId, user2Id: senderId }
                ]
            }
        });

        if (existingFriendship) return res.status(400).json({ error: "Already friends." });

        const existingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId, status: 'PENDING' },
                    { senderId: receiverId, receiverId: senderId, status: 'PENDING' }
                ]
            }
        });

        if (existingRequest) return res.status(400).json({ error: "Request already pending." });

        // Create
        const request = await prisma.friendRequest.create({
            data: { senderId, receiverId, status: 'PENDING' },
            include: { sender: { select: { id: true, username: true } } }
        });

        // Notify socket
        const receiverSocketIds = getReceiverSocketId(receiverId);
        if (receiverSocketIds && receiverSocketIds.length > 0) {
            receiverSocketIds.forEach(socketId => {
                io.to(socketId).emit('newFriendRequest', request);
            });
        }

        res.status(201).json(request);
    } catch (err) {
        console.error('sendRequest:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const myId = req.user.id;

        const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!request || request.receiverId !== myId) {
            return res.status(404).json({ error: "Request not found or not yours to accept." });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: "Request is not pending." });
        }

        // Update request
        await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
        });

        // Create friendship (ensure user1Id < user2Id for consistency, or just store as-is)
        const user1Id = request.senderId < request.receiverId ? request.senderId : request.receiverId;
        const user2Id = request.senderId < request.receiverId ? request.receiverId : request.senderId;

        const newFriendship = await prisma.friendship.create({
            data: { user1Id, user2Id }
        });

        // Socket notify sender
        const senderSocketIds = getReceiverSocketId(request.senderId);
        if (senderSocketIds && senderSocketIds.length > 0) {
            senderSocketIds.forEach(socketId => {
                io.to(socketId).emit('friendRequestAccepted', { requestId, friendId: myId });
            });
        }

        res.status(200).json(newFriendship);
    } catch (err) {
        console.error('acceptRequest:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const myId = req.user.id;

        const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!request || request.receiverId !== myId) {
            return res.status(404).json({ error: "Request not found." });
        }

        await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        });

        res.status(200).json({ message: "Rejected" });
    } catch (err) {
        console.error('rejectRequest:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getPendingRequests = async (req, res) => {
    try {
        const myId = req.user.id;
        const requests = await prisma.friendRequest.findMany({
            where: { receiverId: myId, status: 'PENDING' },
            include: { sender: { select: { id: true, username: true, email: true } } }
        });
        res.status(200).json(requests);
    } catch (err) {
        console.error('getPendingRequests:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getFriends = async (req, res) => {
    try {
        const myId = req.user.id;
        // Fetch friendships
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [{ user1Id: myId }, { user2Id: myId }]
            },
            include: {
                user1: { select: { id: true, username: true, email: true } },
                user2: { select: { id: true, username: true, email: true } }
            }
        });

        // Map to just the friend profile
        const friends = friendships.map(f => f.user1Id === myId ? f.user2 : f.user1);

        res.status(200).json(friends);
    } catch (err) {
        console.error('getFriends:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
