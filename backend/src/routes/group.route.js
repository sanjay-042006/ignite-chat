import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import {
    createGroup,
    getGroups,
    getGroupMessages,
    sendGroupMessage,
    deleteGroup,
    leaveGroup,
} from '../controllers/group.controller.js';

const router = express.Router();

router.post('/', protectRoute, createGroup);
router.get('/', protectRoute, getGroups);
router.get('/:groupId/messages', protectRoute, getGroupMessages);
router.post('/:groupId/send', protectRoute, sendGroupMessage);
router.delete('/:groupId', protectRoute, deleteGroup);
router.post('/:groupId/leave', protectRoute, leaveGroup);

export default router;
