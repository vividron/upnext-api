import redis from "../config/redis.js";
import { delReconnectToRoomId, getGraceTime, getReconnectToRoomId } from "../redis/room.redis.js";
import { getUserSocketCount } from "../redis/socket.redis.js";
import { removeUserFromRoom } from "../services/room.service.js";

let interval = null;
let isLastActivity = false;

export const startPresenceCheckWorker = () => {

  // worker already running.
  if (interval) return;

  interval = setInterval(async () => {
    console.log("worker runnign" + Date.now());

    try {
      const keys = await redis.keys("reconnect:*");

      for (const key of keys) {

        const userId = key.split(":")[1];
        const roomId = await getReconnectToRoomId(userId);
        const grace = await getGraceTime(roomId, userId);

        // waiting for socket to reconnect. 10s grace time
        if (grace) continue;

        // remove user from reconnect, as the socket may have reconnected or the user will be removed from room
        await delReconnectToRoomId(userId);

        const sockets = await getUserSocketCount(roomId, userId);

        if (sockets > 0) continue;

        await removeUserFromRoom(roomId, userId);

        if (isLastActivity) {
          clearInterval(interval);
          interval = null;
          isLastActivity = false
        }
      }
    } catch (error) {
      console.error("Presence check error:", error);
    }

  }, 5000);
}

export const stopPresenceCheckWorker = () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

export const setLastActivity = (val) => {
  isLastActivity = val;
}