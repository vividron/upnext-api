import { socketAuth } from "./middleware/auth.socket.js";
import registerRoomSocket from "./room.socket.js";
import { setIO } from "./socket.gateway.js";
import redis from "../config/redis.js";
import { deleteSocket, getSocket, getUserSocketCount, removeSocketFromUserSockets } from "../redis/socket.redis.js";
import { setGraceTime, setReconnectToRoomId } from "../redis/room.redis.js";

export default function initSockets(io) {

    // Authenticate user 
    io.use(socketAuth);

    setIO(io);

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        registerRoomSocket(socket);

        socket.on("disconnect", async () => {
            try {
                // Get userId and roomId
                const data = await getSocket(socket.id);

                // If no data user manually left room or leave-room event removed user from room
                if (!data) return;

                const { roomId, userId } = JSON.parse(data);

                await removeSocketFromUserSockets(roomId, userId, socket.id);
                await deleteSocket(socket.id);

                const remaining = await getUserSocketCount(roomId, userId);

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
    });
}