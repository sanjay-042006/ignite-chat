import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import { enableAnonymousMode, getAnonymousStatus, sendStrangerMessage } from '../controllers/anonymous.controller.js';

const router = express.Router();

router.post('/enable/:groupId', protectRoute, enableAnonymousMode);
router.get('/status', protectRoute, getAnonymousStatus);
router.post('/stranger/:roomId/send', protectRoute, sendStrangerMessage);

export default router;
