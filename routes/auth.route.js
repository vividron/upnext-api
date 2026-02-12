import express from "express";
import { redirectToSpotifyAuth, handleSpotifyCallback } from "../controllers/auth.controller.js";

const router = express.Router();

// Redirect to spotify login page
router.get("/spotify", redirectToSpotifyAuth);

// Spotify redirect route handler
router.get("/spotify/callback", handleSpotifyCallback);

export default router
