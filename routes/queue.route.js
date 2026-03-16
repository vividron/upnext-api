import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { validateRoomAccess } from "../middleware/room.middleware.js";
import { batchVoteLimiter, validateSongIds, validateVoter } from "../middleware/queue.middleware.js";
import {
    addPlaylistToQueue,
    clearQueue,
    upvoteMatchedSongs
} from "../controllers/queue.controller.js";

const router = express.Router({ mergeParams: true });

// Upvote the matched songs provided by client
router.post('/songs/upvote-matches', validateVoter, batchVoteLimiter, validateSongIds, upvoteMatchedSongs);

router.use(protect, validateRoomAccess);

// Add playlist to queue
router.post('/playlist', addPlaylistToQueue);

// Clear queue
router.delete("/", clearQueue);

export default router;