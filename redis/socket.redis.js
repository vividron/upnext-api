import redis from "../config/redis.js";
import { socketKeys } from "./keys.js";

// User sockets
export const addSocketToUserSockets = (roomId, userId, socketId) => redis.sadd(socketKeys.sockets(roomId, userId, socketId), socketId);
export const getUserSockets = (roomId, userId) => redis.smembers(socketKeys.sockets(roomId, userId));
export const getUserSocketCount = (roomId, userId) => redis.scard(socketKeys.sockets(roomId, userId));
export const removeSocketFromUserSockets = (roomId, userId, socketId) => redis.srem(socketKeys.sockets(roomId, userId, socketId), socketId);

// socketId map to userId and roomId
export const setSocket = (roomId, userId, socketId) => redis.set(socketKeys.socket(socketId), JSON.stringify({ roomId, userId }));
export const getSocket = (socketId) => redis.get(socketKeys.socket(socketId));
export const deleteSocket = (socketId) => redis.del(socketKeys.socket(socketId));

// Socket count
export const increSocketCount = () => redis.incr(socketKeys.socketCount);
export const decreSocketCount = () => redis.decr(socketKeys.socketCount);
export const getSocketCount = () => redis.get(socketKeys.socketCount);
export const delSocketCount = () => redis.del(socketKeys.socketCount);