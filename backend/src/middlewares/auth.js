import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized - Token missing' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_keep_secure');

        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized - Invalid token' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true, email: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
