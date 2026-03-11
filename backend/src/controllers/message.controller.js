import prisma from '../lib/db.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;

        const filteredUsers = await prisma.user.findMany({
            where: {
                id: {
                    not: loggedInUserId,
                },
            },
            select: {
                id: true,
                username: true,
                email: true,
            },
        });

        const friendships = await prisma.friendship.findMany({
            where: { OR: [{ user1Id: loggedInUserId }, { user2Id: loggedInUserId }] }
        });

        const requests = await prisma.friendRequest.findMany({
            where: {
                OR: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
                status: 'PENDING'
            }
        });

        const friendIds = new Set(friendships.map(f => f.user1Id === loggedInUserId ? f.user2Id : f.user1Id));
        const sentReqIds = new Set(requests.filter(r => r.senderId === loggedInUserId).map(r => r.receiverId));
        const recReqIds = new Set(requests.filter(r => r.receiverId === loggedInUserId).map(r => r.senderId));

        const usersWithStatus = filteredUsers.map(user => {
            let status = 'NONE';
            if (friendIds.has(user.id)) status = 'FRIEND';
            else if (sentReqIds.has(user.id)) status = 'PENDING_SENT';
            else if (recReqIds.has(user.id)) status = 'PENDING_RECEIVED';

            let requestId = null;
            if (status === 'PENDING_RECEIVED' || status === 'PENDING_SENT') {
                const reqObj = requests.find(r => (r.senderId === user.id && r.receiverId === loggedInUserId) || (r.senderId === loggedInUserId && r.receiverId === user.id));
                if (reqObj) requestId = reqObj.id;
            }

            return { ...user, friendshipStatus: status, requestId };
        });

        res.status(200).json(usersWithStatus);
    } catch (error) {
        console.error('Error in getUsersForSidebar: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user.id;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: userToChatId, roomType: 'DIRECT' },
                    { senderId: userToChatId, receiverId: myId, roomType: 'DIRECT' },
                ],
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log('Error in getMessages controller: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;

        if (!text) {
            return res.status(400).json({ error: 'Text content is required' });
        }

        // Validate Friendship
        const isFriend = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: senderId, user2Id: receiverId },
                    { user1Id: receiverId, user2Id: senderId }
                ]
            }
        });

        if (!isFriend) {
            return res.status(403).json({ error: 'You can only message friends.' });
        }

        const newMessage = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                content: text,
                roomType: 'DIRECT',
            },
        });

        const receiverSocketIds = getReceiverSocketId(receiverId);
        if (receiverSocketIds && receiverSocketIds.length > 0) {
            receiverSocketIds.forEach(socketId => {
                io.to(socketId).emit('newMessage', newMessage);
            });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log('Error in sendMessage controller: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
