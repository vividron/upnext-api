import redis from "../config/redis.js";
import { roomKeys } from "./keys.js";

// queue
export const setQueue = (roomId, songIdsWithScore) => redis.zadd(roomKeys.queue(roomId), songIdsWithScore);
export const getSortedQueue = (roomId) => redis.zrevrange(roomKeys.queue(roomId), 0, -1, "WITHSCORES"); // Score highest -> lowest
export const getQueueMaxScoreSong = (roomId) => redis.zrevrange(roomKeys.queue(roomId), 0, 0, "WITHSCORES");
export const removeSongFromQueue = (roomId, songId) => redis.zrem(roomKeys.queue(roomId), songId);
export const getSongScores = (roomId, songIds) => redis.zmscore(roomKeys.queue(roomId), songIds);
export const getQueueSongCount = (roomId) => redis.zcard(roomKeys.queue(roomId));
export const clearQueue = (roomId) => redis.del(roomKeys.queue(roomId));

// song meta data
export const setSongMeta = (roomId, songId, songMetaData) => redis.hset(roomKeys.songMeta(roomId, songId), songMetaData);
export const getSongMeta = (roomId, songId) => redis.hgetall(roomKeys.songMeta(roomId, songId));

// vote limit
export const checkVoteLimitExist = (roomId, userId) => redis.exists(roomKeys.voteLimit(roomId, userId));
export const setVoteLimit = (roomId, userId) => redis.setex(roomKeys.voteLimit(roomId, userId), 1, 1);
export const checkBatchVoteLimit = (roomId, userId) => redis.get(roomKeys.batchvoteLimit(roomId, userId));
export const setBatchVoteLimit = (roomId, userId) => redis.setex(roomKeys.batchvoteLimit(roomId, userId), 30, 1);
export const increBatchVoteCount = (roomId, userId) => redis.incr(roomKeys.batchvoteLimit(roomId, userId));

// votes
export const setUserVotes = async (roomId, userId, userVotes) => {

    // format votes
    const formatedVotes = userVotes.map(({ songId, vote }) => [songId, vote]);
    const votesObject = Object.fromEntries(formatedVotes);

    await redis.hset(roomKeys.userVotes(roomId, userId), votesObject);
}

export const getUserVotes = async(roomId, userId) => {
    const votesObject = await redis.hgetall(roomKeys.userVotes(roomId, userId));

    const votes = Object.entries(votesObject).map(([songId, vote]) => ({
        songId,
        vote: Number(vote)
    }));

    return votes
}

export const getRoomUsersVotes = async (roomId) => {
    const keys = await redis.keys(`room:${roomId}:userVotes:*`);

    const result = [];

    for (const key of keys) {
        const userId = key.split(":").pop();

        const votesObject = await redis.hgetall(key);

        const votes = Object.entries(votesObject).map(([songId, vote]) => ({
            songId,
            vote: Number(vote)
        }));

        result.push({
            roomId,
            userId,
            votes
        });
    }

    return result;
}

export const delRoomUsersVotes = async (roomId) => {
    const keys = await redis.keys(`room:${roomId}:userVotes:*`);

    if (keys.length === 0) return;

    await redis.del(keys);

    return;
}