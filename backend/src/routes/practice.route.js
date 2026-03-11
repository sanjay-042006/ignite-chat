import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import {
    sendPracticeMessage,
    getPracticeMessages
} from '../controllers/practice.controller.js';

const router = express.Router();

router.post('/:roomId/send', protectRoute, sendPracticeMessage);
router.get('/:roomId/messages', protectRoute, getPracticeMessages);

export default router;
