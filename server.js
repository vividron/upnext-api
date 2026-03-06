import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import connectDB from './config/db.js';
import authRoutes from './routes/auth.route.js'
import { errorHandler } from './middleware/error.middleware.js';
import roomRoutes from './routes/room.route.js'
import http from "http";
import { Server } from "socket.io";
import initSockets from "./sockets/index.js";
import spotifyRoutes from "./routes/spotify.route.js"

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8000",
    credentials: true,
  },
});

// Initialize sockets
initSockets(io);

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/spotify", spotifyRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
