import { socketAuth } from "./middleware/auth.socket.js";
import registerRoomSocket from "./room.socket.js";
import { setIO } from "./socket.gateway.js";
import * as redisSocketService from "../redis/socket.redis.js";
import { setLastActivity, startPresenceCheckWorker, stopPresenceCheckWorker } from "./presenceChecker.js";
import { setGraceTime, setReconnectToRoomId } from "../redis/room.redis.js";

export default function initSockets(io) {

    // Authenticate user 
    io.use(socketAuth);

    setIO(io);

    io.on("connection", async (socket) => {
        try {
            console.log("Socket connected:", socket.id);

            // Increment socket count.
            await redisSocketService.increSocketCount();
            setLastActivity(false);
            startPresenceCheckWorker()

            registerRoomSocket(socket);

            socket.on("disconnect", async () => {
                try {

                    // decrement socket count
                    await redisSocketService.decreSocketCount();
                    const isNoSocketConnections = Number(await redisSocketService.getSocketCount()) === 0;

                    // Get userId and roomId
                    const data = await redisSocketService.getSocket(socket.id);

                    // If no data user manually left room or leave-room event removed user from room
                    if (!data) {
                        if (isNoSocketConnections) {
                            stopPresenceCheckWorker()
                            await redisSocketService.delSocketCount()
                        }
                        return
                    };

                     if (isNoSocketConnections) {
                        // last activity
                        setLastActivity(true);
                        await redisSocketService.delSocketCount()
                    }

                    // decrement socket count
                    await redisSocketService.decreSocketCount();
                    if (Number(await redisSocketService.getSocketCount()) === 0) {
                        // last activity
                        setLastActivity(true);
                        await redisSocketService.delSocketCount()
                    }

                    const { roomId, userId } = JSON.parse(data);

                    await redisSocketService.removeSocketFromUserSockets(roomId, userId, socket.id);
                    await redisSocketService.deleteSocket(socket.id);

                    const remaining = await redisSocketService.getUserSocketCount(roomId, userId);

                    // user still connected elsewhere
                    if (remaining > 0) return;

                    // grace time to reconnect
                    await setGraceTime(roomId, userId, 20);

                    // Add user to reconnect state. handled by presence worker
                    await setReconnectToRoomId(roomId, userId);
                } catch (error) {
                    console.error("Socket disconnection error", error);
                }
            });
        } catch (error) {
            console.error("Socket connection error:", error);
        }
    });
}