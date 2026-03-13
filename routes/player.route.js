import express from "express";
import { protect, validateAccessToken } from "../middleware/auth.middleware.js";
import { validateRoomAccess } from "../middleware/room.middleware.js";

import {
  getPlayBackState,
  resumePlayer,
  pausePlayer,
  playNext,
  playPrevious,
  seekToPosition
} from "../controllers/player.controller.js";

const router = express.Router({ mergeParams: true });

router.use(protect, validateRoomAccess, validateAccessToken);

// Get playback current state
router.get('/state', getPlayBackState);

// resume player
router.post("/resume", resumePlayer);

// pause player
router.post("/pause", pausePlayer);

// play next song from queue
router.post("/next", playNext);

// play previous song
router.post("/previous", playPrevious);

// seek to position
router.post("/seek", seekToPosition);

export default router;