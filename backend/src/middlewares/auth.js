import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';

export const protectRoute = async (req, res, next) => {
    try {
        let token = req.cookies.jwt;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized - Token missing' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_keep_secure');

        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized - Invalid token' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true, email: true, storyStreak: true, profilePic: true } // Added storyStreak & profilePic
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // --- Love Streak Calculation ---
        const activeLove = await prisma.loveConnection.findFirst({
            where: {
                OR: [{ senderId: decoded.userId }, { receiverId: decoded.userId }],
                status: 'ACCEPTED'
            }
        });

        let loveStreak = 0;
        if (activeLove) {
            const diffDays = Math.ceil(Math.abs(new Date() - new Date(activeLove.createdAt)) / (1000 * 60 * 60 * 24));
            loveStreak = Math.floor(diffDays / 30.44) + 1; // Starts at 1
        }
        
        user.loveStreak = loveStreak;
        // -------------------------------

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
