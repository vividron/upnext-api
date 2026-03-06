import express from "express";
import { protect, validateAccessToken } from "../middleware/auth.middleware.js";
import { getPlayBackState, getPlaylistItems, getUserPlaylists } from "../controllers/spotify.controller.js";

const router = express.Router();

router.use(protect, validateAccessToken)

// Get user playlists
router.get('/playlists', getUserPlaylists);

// Get playlist items
router.get('/playlists/:playlistId/items', getPlaylistItems);

// Get playback current state
router.get('/player', getPlayBackState);

export default router;
