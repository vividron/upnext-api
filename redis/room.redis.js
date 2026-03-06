import redis from "../config/redis.js";
import { roomKeys } from "./keys.js";

// host ID
export const setRoomMeta = (roomId, meta) => redis.hset(roomKeys.roomMeta(roomId), { ...meta });
export const getAllRoomMeta = (roomId) => redis.hgetall(roomKeys.roomMeta(roomId));
export const getRoomMeta = (roomId, val) => redis.hget(roomKeys.roomMeta(roomId), val);
export const existsRoomMeta = (roomId) => redis.exists(roomKeys.roomMeta(roomId));

// player state
export const setPlayerState = (roomId, playerState) => redis.set(roomKeys.playerState(roomId), JSON.stringify(playerState));
export const getPlayerState = (roomId) => redis.get(roomKeys.playerState(roomId));


// Members
export const addMember = (roomId, userId) => redis.sadd(roomKeys.members(roomId), userId);
export const removeMember = (roomId, userId) => redis.srem(roomKeys.members(roomId), userId);
export const getMembers = (roomId) => redis.scard(roomKeys.members(roomId));
export const isMember = (roomId, userId) => redis.sismember(roomKeys.members(roomId), userId)

// queue
export const getSortedQueue = (roomId) => redis.zrevrange(roomKeys.queue(roomId), 0, -1, "WITHSCORES");
export const setQueue = (roomId, songs) => redis.zadd(roomKeys.queue(roomId), songs);

// User reconnect
export const setGraceTime = (roomId, userId, expiryTime) => redis.setex(roomKeys.graceTime(roomId, userId), expiryTime, true);
export const getGraceTime = (roomId, userId) => redis.get(roomKeys.graceTime(roomId, userId));
export const setReconnectToRoomId = (roomId, userId) => redis.set(roomKeys.reconnect(userId), roomId);
export const getReconnectToRoomId = (userId) => redis.get(roomKeys.reconnect(userId));
export const delReconnectToRoomId = (userId) => redis.del(roomKeys.reconnect(userId))

// Clear room keys
export const clearRoomKeys = async (roomId) => {
    try {
        const keys = await redis.keys(`room:${roomId}:*`);

        if (keys.length) {
            await redis.del(keys);
        }
        return true;

    } catch (error) {
        throw error
    }
}

export const addRoomExpiry = async (roomId) => {
    const TTL = process.env.TTL || 30;
    try {
        await Promise.all([
            redis.expire(roomKeys.queue(roomId), TTL),
            redis.expire(roomKeys.roomMeta(roomId), TTL),
            redis.expire(roomKeys.playerState(roomId), TTL),
            redis.expire(roomKeys.members(roomId), TTL)
        ]);
    } catch (error) {
        throw error
    }
}

export const removeRoomExpiry = async (roomId) => {
    const TTL = process.env.TTL || 30;
    try {
        const ttl = await redis.ttl(roomKeys.roomMeta(roomId));

        // host should subscribe within 20s. avoiding expiry and persist race condition
        if (ttl < 10) return false;

        await Promise.all([
            redis.persist(roomKeys.queue(roomId)),
            redis.persist(roomKeys.roomMeta(roomId)),
            redis.persist(roomKeys.playerState(roomId)),
            redis.persist(roomKeys.members(roomId))
        ]);

        return true;
    } catch (error) {
        throw error
    }
}


