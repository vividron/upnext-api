import Room from "../models/Room.js";
import Queue from "../models/Queue.js"
import { getQueue } from "./queue.service.js";
import * as redisRoomService from "../redis/room.redis.js"
import * as redisSocketService from "../redis/socket.redis.js"
import * as redisQueueService from "../redis/queue.redis.js";
import AppError from "../utils/appError.js";
import { getIO } from "../sockets/socket.gateway.js";
import { EVENTS } from "../sockets/socket.events.js";
import Vote from "../models/Vote.js";

export const getRoomState = async (roomId, userId) => {

    // Check if the room meta exist.
    const exists = await redisRoomService.existsRoomMeta(roomId);

    if (!exists) return null;

    const [meta, memberCount, playerState, userVotes, queue] = await Promise.all([
        redisRoomService.getAllRoomMeta(roomId),
        redisRoomService.getMembers(roomId),
        redisRoomService.getPlayerState(roomId),
        redisQueueService.getUserVotes(roomId, userId),
        getQueue(roomId)
    ]);

    const isHost = meta.hostId === userId;

    const roomState = {
        roomTitle: meta.title,
        isHost,
        memberCount,
        playerState,
        queue
    };

    if (!isHost) {
        roomState.userVotes = userVotes;
    }

    return roomState;
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
                for (const song of queue.songs) {

                    songs.push(song.score, song.songId);

                    // hash song meta data
                    await redisQueueService.setSongMeta(roomId, song.songId, {
                        songId: song.songId,
                        artists: song.artists,
                        coverImage: song.coverImage,
                        name: song.name,
                        duration: song.duration
                    });
                }
                // Save queue state to redis
                await redisQueueService.setQueue(roomId, songs);
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

    // Get user votes from database
    const userVotes = await Vote.findOne({ userId });

    if (!userVotes) roomState.userVotes = [];
    else {
        roomState.userVotes = userVotes.votes;
        // Save user votes to redis
        await redisQueueService.setUserVotes(roomId, userId, userVotes.votes);
    }

    await redisRoomService.addMember(roomId, userId);
    roomState.memberCount++;

    // return currrent room state
    return roomState;
}

export const resolveRoomRole = async (roomId, userId) => {

    // Check if room exist in redis session
    const exists = await redisRoomService.existsRoomMeta(roomId);
    if (!exists) throw new AppError("Room is not active", "ROOM_INACTIVE", 400);

    const hostId = await redisRoomService.getRoomMeta(roomId, "hostId");
    const isHost = hostId === userId;

    return isHost
}

export const subscribeRoom = async (roomId, userId, socket) => {

    // Check if the user has joined the room
    const isUserPresent = await redisRoomService.isMember(roomId, userId);
    if (!isUserPresent) throw new AppError("User did not join the room", "USER_NOT_FOUND");

    const isHost = await resolveRoomRole(roomId, userId);

    // Remove room expiry if host. this helps to verify room status. Ex - host joined but never subscribed => room cache removed
    if (isHost) {
        const isRemoved = await redisRoomService.removeRoomExpiry(roomId);
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
        const memberCount = await redisRoomService.getMembers(roomId);
        socket.to(roomId).emit(EVENTS.ROOM_MEMBER_COUNT, memberCount);
    }
}

export const removeUserFromRoom = async (roomId, userId) => {

    const io = getIO();

    // Check if user is present
    const isUserPresent = await redisRoomService.isMember(roomId, userId);
    if (!isUserPresent) throw new AppError("User not present in the room", "USER_NOT_FOUND", 404);

    const isHost = await resolveRoomRole(roomId, userId);

    // If user is host save current room state in DB
    if (isHost) {
        // Get room state from Redis
        const [playerState, queue, roomUsersVotes] = await Promise.all([
            redisRoomService.getPlayerState(roomId),
            getQueue(roomId),
            redisQueueService.getRoomUsersVotes(roomId)
        ]);

        //if player was playing update position. current position = position of seek bar when started playing + time passed
        if (playerState.isPlaying) {
            const currPosition = playerState.position + (Date.now() - playerState.startedAt);
            playerState.position = currPosition;
            playerState.startedAt = null;
            playerState.isPlaying = false;
        }

        // Save room state in DB before cleaning the cache.
        await Room.findByIdAndUpdate(roomId, {
            playerState: playerState,
            isActive: false
        });

        // save queue snapshot
        await Queue.findOneAndUpdate({ roomId }, { $set: { songs: queue } });

        // save votes snapshot. update votes in database. if vote doc not present for a user create one.
        await Vote.bulkWrite(roomUsersVotes.map((item) => ({
            updateOne: {
                filter: {
                    roomId: item.roomId,
                    userId: item.userId
                },
                update: {
                    $set: { votes: item.votes }
                },
                upsert: true
            }
        }))
        );

        // Delete all room cache
        await redisRoomService.clearRoomKeys(roomId);

        // Notify listeners session ended
        io.to(roomId).emit(EVENTS.ROOM_END);

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

    // normal user, remove from members list
    await redisRoomService.removeMember(roomId, userId);

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

    const memberCount = await redisRoomService.getMembers(roomId);

    io.to(roomId).emit(EVENTS.ROOM_MEMBER_COUNT, memberCount);
}


