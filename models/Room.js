import mongoose from "mongoose";

const roomShema = new mongoose.Schema({
    roomCode: {
        type: String,
        unique: true,
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        trim: true,
        required: true
    },

    currentSong: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean
    },
});

export default mongoose.model("Room", roomShema);