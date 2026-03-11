import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

import { app, server } from './lib/socket.js';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import groupRoutes from './routes/group.route.js';
import anonymousRoutes from './routes/anonymous.route.js';
import interestRoutes from './routes/interest.route.js';
import practiceRoutes from './routes/practice.route.js';
import storyRoutes from './routes/story.route.js';
import friendsRoutes from './routes/friends.route.js';


dotenv.config();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/anonymous', anonymousRoutes);
app.use('/api/interest', interestRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/friends', friendsRoutes);



import cron from 'node-cron';
import { evaluateGlobalStories } from './services/ai.service.js';

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'IgniteChat API is running' });
});

// Run Global Evaluations every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily global story evaluation cron job...');
  await evaluateGlobalStories();
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} `);
});
