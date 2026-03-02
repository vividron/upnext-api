import redis from "../../config/redis.js";
import Room from "../../models/Room.js";
import { getIO } from "../socket.gateway.js";

export const addUsertoRoom = async (socketId, roomId, userId) => {

    // Check room cache exist
    let hostId = await redis.get(`room:${roomId}:hostId`);
    let isHost = false;

    // No cache means first room session. Check if room exist and its status add roomInfo to cache.
    if (!hostId) {
        const room = await Room.findById(roomId);

        // check if room exist
        if (!room) {
            throw new Error("Room not found");
        }

        // Make room active if the user is host
        hostId = room.host.toString();
        isHost = hostId === userId;
        if (isHost) {
            await Room.findByIdAndUpdate(roomId, {
                isActive: true
            });

            // Add room state to redis
            await redis.set(`room:${roomId}:hostId`, hostId);
            await redis.set(`room:${roomId}:playerState`, JSON.stringify(room.playerState));
        }
        else {
            throw new Error("Room is not active")
        }
    }
    isHost = hostId === userId;

    await Promise.all([
        redis.sadd(`room:${roomId}:members`, userId),
        redis.sadd(`room:${roomId}:userSockets:${userId}`, socketId),
        redis.set(`socket:${socketId}`, JSON.stringify({ roomId, userId }))
    ]);

    const [memberCount, queue, playerState] = await Promise.all([
        redis.scard(`room:${roomId}:members`),
        redis.zrevrange(`room:${roomId}:queue`, 0, -1, "WITHSCORES"),
        redis.get(`room:${roomId}:playerState`)
    ]);

    // return currrent room state
    return {
        isHost,
        memberCount,
        queue,
        playerState: JSON.parse(playerState)
    }
}

export const removeUserFromRoom = async (roomId, userId) => {

    const io = getIO();

    const hostId = await redis.get(`room:${roomId}:hostId`);
    const isHost = hostId === userId;

    if (isHost) {
        // Get room state from Redis
        const [playerState, queue] = await Promise.all([
            redis.get(`room:${roomId}:playerState`),
            redis.zrevrange(
                `room:${roomId}:queue`,
                0,
                -1,
                "WITHSCORES"
            )
        ]);

        // Save room state to DB before cleaning the cache.
        await Room.findByIdAndUpdate(roomId, {
            hostId: hostId,
            playerState: JSON.parse(playerState),
            isActive: false
        });

        // Notify listeners session ended
        io.to(roomId).emit("room-ended");

        // Disconnect all sockets in room
        const sockets = await io.in(roomId).fetchSockets();

        for (const socket of sockets) {
            if (socket) {
                socket.leave(roomId);
                socket.disconnect(true);
            }
        }

        // Delete all redis cache
        const keys = await redis.keys(`room:${roomId}:*`);

        if (keys.length) {
            await redis.del(keys);
        }

        return;
    }

    // diconnect all the sockets connected to the room
    const socketIds = await redis.smembers(`room:${roomId}:userSockets:${userId}`);

    for (const socketId of socketIds) {
        // remove socket from cache
        await redis.srem(`room:${roomId}:userSockets:${userId}`, socketId);
        await redis.del(`socket:${socketId}`);

        const socket = io.sockets.sockets.get(socketId);

        if (socket) {
            socket.leave(roomId);
            socket.disconnect(true);
        }
    }

    await redis.srem(`room:${roomId}:members`, userId);
    const memberCount = await redis.scard(`room:${roomId}:members`);

    io.to(roomId).emit("member-count-update", memberCount);
}