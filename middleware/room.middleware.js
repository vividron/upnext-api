import AppError from "../utils/appError.js";
import { resolveRoomRole } from "../services/room.service.js";

export const validateRoomAccess = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.userId

        const isHost = await resolveRoomRole(roomId, userId);

        if (!isHost) {
            return next(new AppError("Only host can execute this command", "FORBIDDEN", 403));
        }
        next();

    } catch (error) {
        if(error instanceof AppError) return next(error);
        next(new AppError("Failed to check room access", "ROOM_ACCESS", 400, error));
    }
}