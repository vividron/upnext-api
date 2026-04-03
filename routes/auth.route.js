import express from "express";
import { redirectToSpotifyAuth, handleSpotifyCallback, getCurrentUser } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Redirect to spotify login page
router.get("/spotify", redirectToSpotifyAuth);

// Spotify redirect route handler
router.get("/spotify/callback", handleSpotifyCallback);

// protected routes
router.use(protect);

// Get current user info
router.get('/me', getCurrentUser);

export default router
