import { subscribeRoom } from "./services/room.service.js";

const registerRoomSocket = async (socket) => {

    // subscribe room
    socket.on("subscribe-room", async ({ roomId }, ack) => {
        try {
            if (!roomId || typeof roomId !== "string" || !roomId.trim()) {
                return ack({
                    ok: false,
                    error: {
                        code: "INVALID_ROOM_ID",
                        message: "Invalid room Id"
                    }
                });
            }

            // Get userId from socket auth middleware
            const userId = socket.userId;

            // Add user socket
            await subscribeRoom(roomId, userId, socket);

            ack({ ok: true, message: `Subscribed to room:${roomId} successfully`});
        } catch (error) {
            console.error("Failed to subscribe room:", error)
            ack({
                ok: false, error: {
                    code: error.code || "SUBSCRIBE_ROOM",
                    message: error.message || "Failed to subscribe room"
                }
            });
        }
    });
}

export default registerRoomSocket;