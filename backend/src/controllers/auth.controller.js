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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
    });

    return token;
};

export const signup = async (req, res) => {
    const { username, email, password, profilePic } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        const existingEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (existingEmail) {
            return res.status(400).json({ message: 'Email is already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                ...(profilePic && { profilePic })
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePic: true,
                createdAt: true
            }
        });

        generateToken(newUser.id, res);

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            profilePic: newUser.profilePic,
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
            profilePic: user.profilePic,
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

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user.id;

        if (!profilePic) {
            return res.status(400).json({ message: 'Profile picture is required' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePic },
            select: { id: true, username: true, email: true, profilePic: true, storyStreak: true } // Return needed fields
        });

        // Add dynamically calculated loveStreak since auth.js checkAuth won't run its injection here
        updatedUser.loveStreak = req.user.loveStreak || 0;

        res.status(200).json(updatedUser);
    } catch (error) {
        console.log('Error in updateProfile', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
