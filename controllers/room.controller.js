import Room from "../models/Room.js";
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