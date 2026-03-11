import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';

const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret_key_keep_secure', {
        expiresIn: '7d',
    });

    res.cookie('jwt', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in MS
        httpOnly: true, // prevent XSS attacks cross-site scripting attacks
        sameSite: 'strict', // CSRF attacks cross-site request forgery attacks
        secure: process.env.NODE_ENV !== 'development',
    });

    return token;
};

export const signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true
            }
        });

        generateToken(newUser.id, res);

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
        });
    } catch (error) {
        console.error('Error in signup controller', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        generateToken(user.id, res);

        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
        });
    } catch (error) {
        console.error('Error in login controller', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie('jwt', '', { maxAge: 0 });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log('Error in logout controller', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log('Error in checkAuth controller', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
