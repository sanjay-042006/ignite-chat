import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
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
import loveRoutes from './routes/love.route.js';


// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow any origin during development
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

const __filenameRoot = fileURLToPath(import.meta.url);
const __dirnameRoot = path.dirname(__filenameRoot);
app.use('/uploads', express.static(path.join(__dirnameRoot, '../public/uploads')));

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/anonymous', anonymousRoutes);
app.use('/api/interest', interestRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/love', loveRoutes);



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

// In production, serve the built frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
