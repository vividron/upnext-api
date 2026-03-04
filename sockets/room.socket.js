import { isMember } from "../redis/room.redis.js";
import { addUsertoRoom, removeUserFromRoom } from "./services/room.service.js";

const registerRoomSocket = async (socket) => {

    // Join room
    socket.on("join-room", async ({ roomId }, ack) => {
        try {
            if (!roomId) {
                return ack({ ok: false, message: "Invalid room Id" });
            }

            // Get userId from socket auth middleware
            const userId = socket.userId;

            // Add user to the room and get current room state
            const roomState = await addUsertoRoom(socket.id, roomId, userId);
            socket.join(roomId);

            socket.to(roomId).emit("member-count-update", roomState.memberCount);

            ack({ ok: true, roomState});
        } catch (error) {
            console.error(error)
            ack({ ok: false, message: error.message });
        }
    });

    // leave room
    socket.on("leave-room", async ({ roomId }, ack) => {
        try {
            // Get userId from socket auth middleware
            const userId = socket.userId;

            const isUserPresent = await isMember(roomId, userId);

            if(!isUserPresent) ack({ ok: false, message: "User not present in the room" });

            await removeUserFromRoom(roomId, userId);
            ack({ ok: true });

        } catch (error) {
            console.error(error)
            ack({ ok: false, message: error.message });
        }
    });
}

export default registerRoomSocket;