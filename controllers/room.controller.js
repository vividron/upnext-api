import Room from "../models/Room.js";
import User from "../models/User.js"
import * as roomService from "../services/room.service.js";
import AppError from "../utils/appError.js";
import asyncWrapper from "../utils/asyncWrapper.js";

export const createRoom = asyncWrapper(async (req, res) => {
    const { title } = req.body;
    const userId = req.userId;

    // Check if user has spotify premium. (we can control player only if user has spotify premium)
    const user = await User.findById(userId).select("isPremium");

    if (!user) throw new AppError("User not found", "USER_NOT_FOUND", 400);

    const { isPremium } = user;
    if (!isPremium) throw new AppError("Spotify Premium is required to create a room", "USER_NOT_PREMIUM", 403);

    const room = await Room.create({
        host: req.userId,
        title: title || `Room-${Date.now()}`,
    });

    res.status(200).json({
        success: true,
        room: {
            _id: room._id,
            title: room.title,
            createdAt: room.createdAt
        }
    });
});

export const getRooms = asyncWrapper(async (req, res) => {
    const rooms = await Room.find({ host: req.userId }, "title createdAt isActive").sort({ createdAt: -1 });

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
    const { roomId } = req.params;
    const userId = req.userId;

    // Check if user joined the room and get the room state
    const isUserJoined = await roomService.isUserJoined(roomId, userId);
    if (!isUserJoined) {
        throw new AppError("User did not join the room", "USER_NOT_FOUND", 400);
    }

    const roomState = await roomService.getRoomState(roomId, userId);

    if (!roomState) {
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