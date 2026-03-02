import { socketAuth } from "./middleware/auth.socket.js";

export default function initSockets(io) {

    // Authenticate user 
    io.use(socketAuth);

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        socket.on("disconnect", async () => {
            console.log("Socket disconnected:", socket.id);
        });
    });
}