import { EVENTS } from "./socket.events.js";

const registerPlayerSocket = (socket) => {
    socket.on(EVENTS.PLAYER_SYNC_FAILED, ({ roomId, syncError }) => {
        socket.to(roomId).emit(EVENTS.PLAYER_SYNC_FAILED, { syncError });
    });
};

export default registerPlayerSocket;