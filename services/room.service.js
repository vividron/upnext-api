import Room from "../models/Room.js";
import { getQueue } from "./queue.service.js";
import Queue from "../models/Queue.js"
import * as redisRoomService from "../redis/room.redis.js"
import AppError from "../utils/appError.js";
import { unSubscribeRoom } from "../sockets/services/room.service.js";

export const getRoomState = async (roomId, userId) => {

    // Check if the room meta exist.
    const exists = await redisRoomService.existsRoomMeta(roomId);

    if (!exists) return null;

    const [meta, memberCount, queue, playerState] = await Promise.all([
        redisRoomService.getAllRoomMeta(roomId),
        redisRoomService.getMembers(roomId),
        getQueue(roomId),
        redisRoomService.getPlayerState(roomId)
    ]);

    const isHost = meta.hostId === userId;

    return {
        roomTitle: meta.title,
        isHost,
        memberCount,
        queue,
        playerState: JSON.parse(playerState)
    }
}

export const addUsertoRoom = async (roomId, userId) => {

    // Check if user already present
    const isUserPresent = await redisRoomService.isMember(roomId, userId);
    if (isUserPresent) {
        throw new AppError("User already joined the room", "USER_ALREADY_PRESENT", 400);
    }

    const roomState = await getRoomState(roomId, userId);

    // If roomState is null then room is inactive. if user is host start the session.
    if (!roomState) {

        const room = await Room.findOne({ host: userId });

        // check if room exist
        if (!room) throw new AppError("Room not found", "ROOM_NOT_FOUND", 404);

        const isHost = room.host.toString() === userId;

        // Check if user is host
        if (isHost) {

            // Make room active
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
                redisRoomService.setRoomMeta(roomId, { hostId: room.host, title: room.title }),
                redisRoomService.setPlayerState(roomId, room.playerState),
                redisRoomService.addMember(roomId, userId),
            ]);

            // Add expiry to room state. If host don't subscribe the room then room cache will be removed automatically.
            await redisRoomService.addRoomExpiry(roomId);

            return {
                title: room.title,
                isHost,
                memberCount: 1,
                queue: queue?.songs ?? [],
                playerState: room.playerState
            }
        }
        else {
            throw new AppError("Room is not active", "ROOM_INACTIVE", 400);
        }
    }

    await redisRoomService.addMember(roomId, userId);
    roomState.memberCount++;

    // return currrent room state
    return roomState;
}

export const resolveRoomRole = async (roomId, userId) => {

    // Check if room exist
    const exists = await redisRoomService.existsRoomMeta(roomId);

    if (!exists) throw new AppError("Room is not active", "ROOM_INACTIVE", 400);

    const hostId = await redisRoomService.getRoomMeta(roomId, "hostId");
    const isHost = hostId === userId;

    return isHost
}

export const removeUserFromRoom = async (roomId, userId) => {

    // Check if user is present
    const isUserPresent = await redisRoomService.isMember(roomId, userId);
    if (!isUserPresent) throw new AppError("User not present in the room", "USER_NOT_FOUND", 404);

    const isHost = await resolveRoomRole(roomId, userId);

    // If user is host save current room state in DB
    if (isHost) {
        // Get room state from Redis
        const [playerState, queue] = await Promise.all([
            redisRoomService.getPlayerState(roomId),
            getQueue(roomId)
        ]);

        // Save room state in DB before cleaning the cache.
        await Room.findByIdAndUpdate(roomId, {
            playerState: JSON.parse(playerState),
            isActive: false
        });

        await Queue.findOneAndUpdate({ roomId }, { $set: { songs: queue } });

        // Delete all redis cache
        await redisRoomService.clearRoomKeys(roomId);

        // unsubscribe the room
        await unSubscribeRoom(roomId, userId, isHost);

        return;
    }

    // normal user, remove from members list
    await redisRoomService.removeMember(roomId, userId);

    // unsubscribe the room
    await unSubscribeRoom(roomId, userId, isHost);
}

