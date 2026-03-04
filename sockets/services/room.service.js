import Room from "../../models/Room.js";
import { getIO } from "../socket.gateway.js";
import { getQueue } from "./queue.service.js";
import Queue from "../../models/Queue.js"
import * as redisRoomService from "../../redis/room.redis.js"
import * as redisSocketService from "../../redis/socket.redis.js"

export const addUsertoRoom = async (socketId, roomId, userId) => {

    // Check room cache exist
    let hostId = await redisRoomService.getHostId(roomId);
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
            const queue = await Queue.findOne({ roomId });

            // sepearate score and songs for multi upload in redis sorted set [{score, song}]
            const songs = [];
            if (queue && queue?.songs.length > 0) {
                queue.songs.forEach((song) => {
                    songs.push(
                        song.score,
                        JSON.stringify({
                            songId: song.songId,
                            artists: song.artists,
                            coverImage: song.coverImage,
                            name: song.name,
                            duration: song.duration
                        })
                    );
                });
                // Save queue state to redis
                await redisRoomService.setQueue(roomId, songs);
            }

            // Add room state to redis
            await Promise.all([
                redisRoomService.setHostId(roomId, hostId),
                redisRoomService.setPlayerState(roomId, room.playerState),
                redisRoomService.addMember(roomId, userId),
                redisSocketService.addSocketToUserSockets(roomId, userId, socketId),
                redisSocketService.setSocket(roomId, userId, socketId)
            ]);

            return {
                isHost,
                memberCount: 1,
                queue: queue?.songs ?? [],
                playerState: room.playerState
            }
        }
        else {
            throw new Error("Room is not active")
        }
    }
    isHost = hostId === userId;

    await Promise.all([
        redisRoomService.addMember(roomId, userId),
        redisSocketService.addSocketToUserSockets(roomId, userId, socketId),
        redisSocketService.setSocket(roomId, userId, socketId)
    ]);

    const [memberCount, queue, playerState] = await Promise.all([
        redisRoomService.getMembers(roomId),
        getQueue(roomId),
        redisRoomService.getPlayerState(roomId)
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

    const hostId = await redisRoomService.getHostId(roomId);
    const isHost = hostId === userId;

    if (isHost) {
        // Get room state from Redis
        const [playerState, queue] = await Promise.all([
            redisRoomService.getPlayerState(roomId),
            getQueue(roomId)
        ]);

        // Save room state to DB before cleaning the cache.
        await Room.findByIdAndUpdate(roomId, {
            hostId: hostId,
            playerState: JSON.parse(playerState),
            isActive: false
        });

        await Queue.findOneAndUpdate({ roomId }, { $set: { songs: queue } });

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

        // Delete all redis cache
        await redisRoomService.clearRoomKeys(roomId);
        return;
    }

    // diconnect all the sockets connected to the room
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

    await redisRoomService.removeMember(roomId, userId);
    const memberCount = await redisRoomService.getMembers(roomId);

    io.to(roomId).emit("member-count-update", memberCount);
}
