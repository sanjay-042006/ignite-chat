import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import {
    getStoryLibrary,
    getGlobalWinner,
    getStoryDetails,
    getMyActiveStory,
    contributeToStory
} from '../controllers/story.controller.js';

const router = express.Router();

// Get public story library
router.get('/library', protectRoute, getStoryLibrary);

// Get global winner
router.get('/library/global-winner', protectRoute, getGlobalWinner);

// Get specific story details
router.get('/:id', protectRoute, getStoryDetails);

// Get user's currently active story group
router.get('/me/active', protectRoute, getMyActiveStory);

// Contribute to the active story (day by day)
router.post('/:id/contribute', protectRoute, contributeToStory);

export default router;
