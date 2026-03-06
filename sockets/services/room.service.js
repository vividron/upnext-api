import { getIO } from "../socket.gateway.js";
import * as redisSocketService from "../../redis/socket.redis.js"
import AppError from "../../utils/appError.js";
import { isMember, getMembers, removeRoomExpiry } from "../../redis/room.redis.js";
import { resolveRoomRole } from "../../services/room.service.js";

export const subscribeRoom = async (roomId, userId, socket) => {

    // Check if the user has joined the room
    const isUserPresent = await isMember(roomId, userId);
    if (!isUserPresent) throw new AppError("User did not join the room", "USER_NOT_FOUND");

    const isHost = await resolveRoomRole(roomId, userId);

    // Remove room expiry if host. this helps to verify room status. Ex - host joined but never subscribed => room cache removed
    if (isHost) {
        const isRemoved = await removeRoomExpiry(roomId);
        if (!isRemoved) throw new AppError("User did not join the room", "USER_NOT_FOUND");
    }

    // Add socket
    await Promise.all([
        redisSocketService.addSocketToUserSockets(roomId, userId, socket.id),
        redisSocketService.setSocket(roomId, userId, socket.id)
    ]);

    socket.join(roomId);

    const socketCount = await redisSocketService.getUserSocketCount(roomId, userId);

    if (socketCount === 1) {
        const memberCount = await getMembers(roomId);
        socket.to(roomId).emit("member-count-update", memberCount);
    }
}

export const unSubscribeRoom = async (roomId, userId, isHost) => {

    const io = getIO();

    if (isHost) {

        // Notify listeners session ended
        io.to(roomId).emit("room-ended");

        // Disconnect all sockets in room
        const sockets = await io.in(roomId).fetchSockets();

        for (const socket of sockets) {
            // remove socket from cache
            await redisSocketService.removeSocketFromUserSockets(roomId, userId, socket.id);
            await redisSocketService.deleteSocket(socket.id);

            if (socket) {
                socket.leave(roomId);
                socket.disconnect(true);
            }
        }

        return;
    }

    // diconnect all the user sockets connected to the room
    const socketIds = await redisSocketService.getUserSockets(roomId, userId);

    for (const socketId of socketIds) {
        // remove socket from cache
        await redisSocketService.removeSocketFromUserSockets(roomId, userId, socketId);
        await redisSocketService.deleteSocket(socketId);

        const socket = io.sockets.sockets.get(socketId);

        if (socket) {
            socket.leave(roomId);
            socket.disconnect(true);
        }
    }

    const memberCount = await getMembers(roomId);

    io.to(roomId).emit("member-count-update", memberCount);
}
