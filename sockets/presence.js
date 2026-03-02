import redis from "../config/redis.js";
import { removeUserFromRoom } from "./services/room.service.js";

export const startPresenceWorker = () => {
  setInterval(async () => {

    try {
      const keys = await redis.keys("reconnect:*");

      for (const key of keys) {

        const userId = key.split(":")[1];
        const roomId = await redis.get(`reconnect:${userId}`);
        const grace = await redis.get(`room:${roomId}:grace:${userId}`);

        // waiting for socket to reconnect. 10s grace time
        if (grace) continue;

        // remove user from reconnect, as the socket may have reconnected or the user will be removed from room
        await redis.del(`reconnect:${userId}`);

        const sockets = await redis.scard(`room:${roomId}:userSockets:${userId}`);

        if (sockets > 0) continue;

        await removeUserFromRoom(roomId, userId);
      }
    } catch (error) {
      console.error("Presence check error:", error);
    }

  }, 5000);
}