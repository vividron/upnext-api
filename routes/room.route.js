import express from "express";
import {
    createRoom,
    deleteRoom,
    getRoom,
    getRooms,
    joinRoom,
    leaveRoom
} from '../controllers/room.controller.js'
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Create room
router.post('/create', createRoom);

// Get all rooms
router.get('/', getRooms);

// Join room
router.post('/:roomId/join', joinRoom);

// leave room
router.post("/:roomId/leave", leaveRoom);

// Get room state
router.get('/:roomId', getRoom);

// Delete room
router.delete('/:roomId', deleteRoom);

export default router;