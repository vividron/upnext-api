import Queue from "../models/Queue.js";
import * as redisRoomService from "../redis/room.redis.js";
import { EVENTS } from "../sockets/socket.events.js";
import { getIO } from "../sockets/socket.gateway.js";
import AppError from "../utils/appError.js";

export const getQueue = async (roomId) => {

    const mixArray = await redisRoomService.getSortedQueue(roomId);
    const queue = [];

    for (let i = 0; i < mixArray.length; i += 2) {
        // mixArray[i] = songId, mixArray[i+1] = score of that song
        const songMetaData = await redisRoomService.getSongMeta(roomId, mixArray[i]);
        queue.push({
            ...songMetaData,
            score: mixArray[i + 1]
        });
    }

    return queue;
}

export const addPlaylistToQueue = async (roomId, songs) => {

    // Maximum songs in the queue
    const MAX_QUEUE_SIZE = Number(process.env.MAX_QUEUE_SIZE) || 100;
    const songCount = await redisRoomService.getQueueSongCount(roomId);

    if (songCount > MAX_QUEUE_SIZE) throw new AppError("Can't add song. Queue limit reached", "QUEUE_LIMIT_EXCEEDED", 400);

    // Check for songs already in the queue
    const songIds = songs.map((song) => song.songId);
    const scores = await redisRoomService.getQueueScores(roomId, songIds);

    // Keep only songs not already in the queue
    const filteredSongs = songs.filter((song, index) => scores[index] === null);

    // Playlist songs already in queue
    if (filteredSongs.length === 0) throw new AppError("All songs from this playlist are already in the queue", "DUPLICATE_SONG_ADD", 400);

    // Add initail score (0) to each song for multi upload in redis sorted set [{score, song}]
    const songsWithInitialScore = []

    for (const song of filteredSongs) {

        songsWithInitialScore.push(0, song.songId);

        // Save song meta data in hash
        await redisRoomService.setSongMeta(roomId, song.songId, song)
    }

    // Add songs with initial score 0 to sorted set
    await redisRoomService.setQueue(roomId, songsWithInitialScore);

    // Update queue in the database
    await Queue.findOneAndUpdate({ roomId }, { $push: { songs: filteredSongs } }, { upsert: true });

    getIO().to(roomId).emit(EVENTS.QUEUE_ADD_SONGS, { songs: filteredSongs });
}

export const clearQueue = async (roomId) => {

    // delete queue from cache (sorted set) and from database
    await Promise.all([
        redisRoomService.clearQueue(roomId),
        Queue.findOneAndDelete({ roomId })
    ]);

    getIO().to(roomId).emit(EVENTS.QUEUE_CLEAR);
}