import { socketAuth } from "./middleware/auth.socket.js";
import registerRoomSocket from "./room.socket.js";
import { setIO } from "./socket.gateway.js";
import redis from "../config/redis.js";

export default function initSockets(io) {

    // Authenticate user 
    io.use(socketAuth);

    setIO(io);

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        registerRoomSocket(socket);

        socket.on("disconnect", async () => {
            console.log("Socket disconnected:", socket.id);
            try {
                // Remove socket
                const data = await redis.get(`socket:${socket.id}`);

                // If no data user manually left room. leave-room event removed user from room
                if (!data) return;

                const { roomId, userId } = JSON.parse(data);

                await redis.srem(`room:${roomId}:userSockets:${userId}`, socket.id);
                await redis.del(`socket:${socket.id}`);

                const remaining = await redis.scard(`room:${roomId}:userSockets:${userId}`);

                // user still connected elsewhere
                if (remaining > 0) return;

                // grace time to reconnect
                await redis.setex(
                    `room:${roomId}:grace:${userId}`,
                    20,
                    true
                );
                // Add user to reconnect state. handled by presence worker
                await redis.set(`reconnect:${userId}`, roomId);
            } catch (error) {
                console.error("Socket disconnection error", error);
            }
        });
    });
}


