import redis from "../config/redis.js";
import { roomKeys } from "./keys.js";

// host ID
export const setHostId = (roomId, hostId) => redis.set(roomKeys.hostId(roomId), hostId);
export const getHostId = (roomId) => redis.get(roomKeys.hostId(roomId));

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
export const setGraceTime = (roomId, userId, expiryTime) =>  redis.setex(roomKeys.graceTime(roomId, userId), expiryTime, true);
export const getGraceTime = (roomId, userId) =>  redis.get(roomKeys.graceTime(roomId, userId));
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






