import express from "express";
import {
    createRoom,
    deleteRoom,
    getRooms
} from '../controllers/room.controller.js'
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post('/create', createRoom);
router.get('/', getRooms);
router.delete('/:roomId', deleteRoom);

export default router;