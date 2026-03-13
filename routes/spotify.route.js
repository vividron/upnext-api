import express from "express";
import { protect, validateAccessToken } from "../middleware/auth.middleware.js";
import { getPlaylistItems, getUserPlaylists } from "../controllers/spotify.controller.js";

const router = express.Router();

router.use(protect, validateAccessToken)

// Get user playlists
router.get('/playlists', getUserPlaylists);

// Get playlist items
router.get('/playlists/:playlistId/items', getPlaylistItems);

export default router;
