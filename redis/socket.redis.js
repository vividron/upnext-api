import redis from "../config/redis.js";
import { keys } from "./keys.js";

export const addSocketToUserSockets = (roomId, userId, socketId) => redis.sadd(keys.sockets(roomId, userId, socketId), socketId);

export const getUserSockets = (roomId, userId) => redis.smembers(keys.sockets(roomId, userId));

export const getUserSocketCount = (roomId, userId) => redis.scard(keys.sockets(roomId, userId));

export const removeSocketFromUserSockets = (roomId, userId, socketId) => redis.srem(keys.sockets(roomId, userId, socketId), socketId);

export const setSocket = (roomId, userId, socketId) => redis.set(keys.socket(socketId), JSON.stringify({ roomId, userId }));

export const getSocket = (socketId) => redis.get(keys.socket(socketId));

export const deleteSocket = (socketId) => redis.del(keys.socket(socketId));