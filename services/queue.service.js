import Queue from "../models/Queue.js";
import Vote from "../models/Vote.js";
import * as redisQueueService from "../redis/queue.redis.js";
import { EVENTS } from "../sockets/socket.events.js";
import { getIO } from "../sockets/socket.gateway.js";
import AppError from "../utils/appError.js";
import { batchVoteSongs } from "./vote.service.js";

export const getQueue = async (roomId) => {

    const mixArray = await redisQueueService.getSortedQueue(roomId);

    const tasks = [];

    for (let i = 0; i < mixArray.length; i += 2) {
        const songId = mixArray[i];
        const score = mixArray[i + 1];

        tasks.push(redisQueueService.getSongMeta(roomId, songId).then(meta => ({ ...meta, score })));
    }

    return await Promise.all(tasks);
}

export const addPlaylistToQueue = async (roomId, songs) => {

    // Check for songs already in the queue
    const songIds = songs.map((song) => song.songId);
    const scores = await redisQueueService.getSongScores(roomId, songIds);

    // Keep only songs not already in the queue
    const filteredSongs = songs.filter((song, index) => scores[index] === null);

    // Playlist songs already in queue
    if (filteredSongs.length === 0) throw new AppError("All songs from this playlist are already in the queue", "DUPLICATE_SONG_ADD", 400);

    // Check queue size limit
    const MAX_QUEUE_SIZE = Number(process.env.MAX_QUEUE_SIZE) || 100;
    const songCount = await redisQueueService.getQueueSongCount(roomId);

    const availableSlots = MAX_QUEUE_SIZE - songCount;

    const songsToAdd = filteredSongs.slice(0, availableSlots);

    if (songsToAdd.length === 0) {
        throw new AppError("Can't add song. Queue limit reached", "QUEUE_LIMIT_EXCEEDED", 400);
    }

    // Add initail score (0) to each song for multi upload in redis sorted set [{score, song}]
    const songsWithInitialScore = [];
    const setSongPromises = [];

    for (const song of songsToAdd) {

        songsWithInitialScore.push(0, song.songId);

        // Save songs meta data in hash
        setSongPromises.push(redisQueueService.setSongMeta(roomId, song.songId, song))
    }

    await Promise.all(setSongPromises);

    // Add songs with initial score 0 to sorted set
    await redisQueueService.setQueue(roomId, songsWithInitialScore);
    // get the song from sorted set after initialization because it ensures same order of song and state of queue on client and server
    const addedSongs = await getQueue(roomId);

    // Update queue in the database
    await Queue.findOneAndUpdate({ roomId }, { $push: { songs: addedSongs } }, { upsert: true });

    getIO().to(roomId).emit(EVENTS.QUEUE_ADD_SONGS, addedSongs);
}

export const upvoteMatchedSongs = async (roomId, userId, songIds) => {

    const results = await batchVoteSongs(roomId, userId, songIds);

    if (results.length === 0) throw new AppError("Songs already upvoted", "SONG_UPVOTE_DUPLICATE", 400);

    // broadcast votes
    getIO().to(roomId).emit(EVENTS.QUEUE_SCORES_UPDATED, results);
}

export const clearQueue = async (roomId) => {

    // delete queue and user votes from redis and database
    await Promise.all([
        redisQueueService.clearQueue(roomId),
        Queue.findOneAndDelete({ roomId }),
        redisQueueService.delRoomUsersVotes(roomId),
        Vote.deleteMany({ roomId })
    ]);

    getIO().to(roomId).emit(EVENTS.QUEUE_CLEAR);
}

// Filter songs which are present in the queue
export const filterSongsInQueue = async (roomId, songIds) => {

    const scores = await redisQueueService.getSongScores(roomId, songIds);

    // Songs which are present in the queue will have score value.
    const filteredSongIds = songIds.filter((_, index) => scores[index] !== null);

    return filteredSongIds;
}

export const isSongInQueue = async (roomId, songId) => {
    const score = await redisQueueService.getSongScores(roomId, songId);
    if (score[0] === null) return false;
    return true;
}
