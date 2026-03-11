import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import {
    joinInterestRoom,
    getInterestRoomMessages,
    sendInterestMessage
} from '../controllers/interest.controller.js';

const router = express.Router();

router.post('/join', protectRoute, joinInterestRoom);
router.get('/:roomId/messages', protectRoute, getInterestRoomMessages);
router.post('/:roomId/send', protectRoute, sendInterestMessage);

export default router;
