import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { getMessages, getUsersForSidebar, sendMessage, markMessagesAsSeen } from '../controllers/message.controller.js';

const router = express.Router();

router.get('/users', protectRoute, getUsersForSidebar);
router.get('/:id', protectRoute, getMessages);

router.post('/upload', protectRoute, upload.single('media'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const mediaUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ mediaUrl });
});

router.post('/send/:id', protectRoute, sendMessage);
router.put('/seen/:senderId', protectRoute, markMessagesAsSeen);

export default router;
