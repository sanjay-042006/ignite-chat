import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import {
    sendLoveRequest,
    acceptLoveRequest,
    rejectLoveRequest,
    getConnections,
    getLoveMessages,
    sendLoveMessage,
    triggerAIChat,
    initiateBreakup,
    acceptBreakup,
    cancelBreakup,
} from '../controllers/love.controller.js';

const router = express.Router();

router.get('/connections', protectRoute, getConnections);
router.post('/request/:userId', protectRoute, sendLoveRequest);
router.post('/accept/:connectionId', protectRoute, acceptLoveRequest);
router.post('/reject/:connectionId', protectRoute, rejectLoveRequest);
router.get('/:connectionId/messages', protectRoute, getLoveMessages);
router.post('/:connectionId/send', protectRoute, sendLoveMessage);
router.post('/:connectionId/ai-chat', protectRoute, triggerAIChat);
router.post('/:connectionId/breakup', protectRoute, initiateBreakup);
router.post('/:connectionId/breakup/accept', protectRoute, acceptBreakup);
router.post('/:connectionId/breakup/cancel', protectRoute, cancelBreakup);

export default router;
