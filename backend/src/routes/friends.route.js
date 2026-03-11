import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import { sendRequest, acceptRequest, rejectRequest, getFriends, getPendingRequests } from '../controllers/friends.controller.js';

const router = express.Router();

router.post('/request/:receiverId', protectRoute, sendRequest);
router.post('/accept/:requestId', protectRoute, acceptRequest);
router.post('/reject/:requestId', protectRoute, rejectRequest);
router.get('/', protectRoute, getFriends);
router.get('/requests', protectRoute, getPendingRequests); // pending incoming

export default router;
