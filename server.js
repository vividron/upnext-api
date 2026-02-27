import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import connectDB from './config/db.js';
import authRoutes from './routes/auth.route.js'
import { errorHandler } from './middleware/error.middleware.js';
import roomRoutes from './routes/room.route.js'

const app = express();

connectDB();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
