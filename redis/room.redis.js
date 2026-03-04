import redis from "../config/redis.js";
import { keys } from "./keys.js";

// host ID
export const setHostId = (roomId, hostId) => redis.set(keys.hostId(roomId), hostId);
export const getHostId = (roomId) => redis.get(keys.hostId(roomId));

// player state
export const setPlayerState = (roomId, playerState) => redis.set(keys.playerState(roomId), JSON.stringify(playerState));
export const getPlayerState = (roomId) => redis.get(keys.playerState(roomId));


// Members
export const addMember = (roomId, userId) => redis.sadd(keys.members(roomId), userId);
export const removeMember = (roomId, userId) => redis.srem(keys.members(roomId), userId);
export const getMembers = (roomId) => redis.scard(keys.members(roomId));
export const isMember = (roomId, userId) => redis.sismember(keys.members(roomId), userId)

// queue
export const getSortedQueue = (roomId) => redis.zrevrange(keys.queue(roomId), 0, -1, "WITHSCORES");
export const setQueue = (roomId, songs) => redis.zadd(keys.queue(roomId), songs);

// User reconnect
export const setGraceTime = (roomId, userId, expiryTime) =>  redis.setex(keys.graceTime(roomId, userId), expiryTime, true);
export const getGraceTime = (roomId, userId) =>  redis.get(keys.graceTime(roomId, userId));
export const setReconnectToRoomId = (roomId, userId) => redis.set(keys.reconnect(userId), roomId);
export const getReconnectToRoomId = (userId) => redis.get(keys.reconnect(userId));
export const delReconnectToRoomId = (userId) => redis.del(keys.reconnect(userId))

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






