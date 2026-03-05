import Room from "../models/Room.js";
import * as roomService  from "../services/room.service.js";
import { unSubscribeRoom } from "../sockets/services/room.service.js";
import asyncWrapper from "../utils/asyncWrapper.js";

export const createRoom = asyncWrapper(async (req, res) => {
    const { title } = req.body;
    const room = await Room.create({
        host: req.userId,
        title: title || `Room-${Date.now()}`,
    });

    res.status(200).json({
        success: true,
        room: {
            roomId: room._id,
            title: room.title,
            createdAt: room.createdAt
        }
    });
});

export const getRooms = asyncWrapper(async (req, res) => {
    const rooms = await Room.find({ host: req.userId }, "title createdAt");

    if (rooms.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No rooms found",
            rooms: []
        });
    }

    res.status(200).json({
        success: true,
        rooms
    });

})

export const joinRoom = asyncWrapper(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.userId;

    const roomState = await roomService.addUsertoRoom(roomId, userId);

    res.status(200).json({
        success: true,
        roomState
    });
});

export const leaveRoom = asyncWrapper(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.userId;

    await roomService.removeUserFromRoom(roomId, userId);
    await unSubscribeRoom(roomId, userId);

    res.status(200).json({
        success: true,
        message: "User left the room successfully"
    })
});

export const getRoom = asyncWrapper(async (req, res) => {
    const {roomId} = req.params;
    const userId = req.userId;

    const roomState = await roomService.getRoomState(roomId, userId);

    if(!roomState) {
        return res.status(400).json({
            success: false,
            error: {
                code: "ROOM_NOT_FOUND",
                message: "Room not found or the room is not active"
            }
        })
    }

    res.status(200).json({
        success: true,
        roomState
    });
})

export const deleteRoom = asyncWrapper(async (req, res) => {
    const { roomId } = req.params;

    // Check if the room exist
    const room = await Room.findById(roomId);

    if (!room) {
        return res.status(404).json({
            success: false,
            error: {
                code: "ROOM_NOT_FOUND",
                message: "Room not found"
            }
        });
    }

    //Check if the room is active
    if (room.isActive) {
        return res.status(400).json({
            success: false,
            error: {
                code: "ROOM_ACTIVE",
                message: "Cannot delete active room"
            }
        });
    }
    await room.deleteOne()

    res.status(200).json({
        success: true,
        message: "Room deleted successfully"
    })
});