import Room from "../models/Room.js";
import * as roomService  from "../services/room.service.js";
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
        throw new AppError("Room not found or the room is not active", "ROOM_NOT_FOUND", 404);
    }

    res.status(200).json({
        success: true,
        roomState
    });
})

export const deleteRoom = asyncWrapper(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.userId;

    const room = await Room.findOne({ _id: roomId, host: userId });

    // Check if the room exist
     if (!room) {
        throw new AppError("Room not found", "ROOM_NOT_FOUND", 404);
    }

    //Check if the room is active
    if (room.isActive) {
        throw new AppError("Cannot delete active room", "ROOM_ACTIVE", 400);
    }

    await room.deleteOne()

    res.status(200).json({
        success: true,
        message: "Room deleted successfully"
    })
});