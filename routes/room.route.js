import express from "express";
import {
    createRoom,
    deleteRoom
} from '../controllers/room.controller.js'
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post('/create', protect, createRoom);
router.delete('/:roomId', protect, deleteRoom);

export default router;