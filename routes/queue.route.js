import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { validateRoomAccess } from "../middleware/room.middleware.js";
import { addPlaylistToQueue, clearQueue } from "../controllers/queue.controller.js";

const router = express.Router({ mergeParams: true });

router.use(protect, validateRoomAccess);

// Add playlist to queue
router.post('/playlist', addPlaylistToQueue);

// Clear queue
router.delete("/", clearQueue);

export default router;