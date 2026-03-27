import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';
import { handleStrangerSockets } from './strangerQueue.js';
import { handlePracticeSockets } from '../controllers/practice.controller.js';
import { handleStorySockets } from './storyQueue.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: function(origin, callback) {
            if (!origin) return callback(null, true);
            callback(null, true);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    }
});

// Used to get a user's socket IDs given their user ID (for 1-to-1 messaging)
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId] || [];
};

const userSocketMap = {}; // { userId: [socketId1, socketId2] }

// Socket Auth Middleware
io.use(async (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) return next(new Error('Authentication error'));

        // Quick parse cookie for 'jwt'
        const tokenCookie = cookies.split('; ').find(row => row.startsWith('jwt='));
        const token = tokenCookie ? tokenCookie.split('=')[1] : null;

        if (!token) return next(new Error('Authentication error: Token missing'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_keep_secure');
        if (!decoded) return next(new Error('Authentication error: Invalid Token'));

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true }
        });

        if (!user) return next(new Error('Authentication error: User not found'));

        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username, socket.id);

    const userId = socket.user.id;
    if (!userSocketMap[userId]) {
        userSocketMap[userId] = [];
    }
    userSocketMap[userId].push(socket.id);

    // Emit event to all clients to update online status
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    // Join group rooms automatically based on memberships
    prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true }
    }).then(memberships => {
        memberships.forEach(membership => {
            socket.join(membership.groupId);
        });
    }).catch(err => {
        console.error("Error joining group rooms:", err);
    });

    // Also allow dynamic joins via client request when creating/invited to new groups
    socket.on('stopTyping', ({ receiverId }) => {
        const receiverSocketIds = getReceiverSocketId(receiverId);
        receiverSocketIds.forEach(socketId => {
            io.to(socketId).emit('userStoppedTyping', { senderId: userId });
        });
    });

    socket.on('typing', ({ receiverId }) => {
        const receiverSocketIds = getReceiverSocketId(receiverId);
        receiverSocketIds.forEach(socketId => {
            io.to(socketId).emit('userTyping', { senderId: userId });
        });
    });

    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
    });

    socket.on('joinInterestSocket', (roomId) => {
        socket.join(`interest_${roomId}`);
    });

    socket.on('leaveInterestSocket', (roomId) => {
        socket.leave(`interest_${roomId}`);
    });

    socket.on('joinStrangerRoom', (roomId) => {
        socket.join(`stranger_${roomId}`);
    });

    handleStrangerSockets(socket, io);
    handlePracticeSockets(socket, io);
    handleStorySockets(socket, io);

    // Love rooms
    socket.on('joinLoveRoom', (connectionId) => {
        socket.join(`love_${connectionId}`);
    });

    socket.on('leaveLoveRoom', (connectionId) => {
        socket.leave(`love_${connectionId}`);
    });

    // Auto-join love rooms
    prisma.loveConnection.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
            status: 'ACCEPTED'
        },
        select: { id: true }
    }).then(connections => {
        connections.forEach(c => {
            socket.join(`love_${c.id}`);
        });
    }).catch(err => {
        console.error("Error joining love rooms:", err);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.user.username, socket.id);

        if (userSocketMap[userId]) {
            userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id);
            if (userSocketMap[userId].length === 0) {
                delete userSocketMap[userId];
            }
        }

        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});

export { app, io, server };
