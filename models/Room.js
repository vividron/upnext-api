import mongoose from "mongoose";

const roomShema = new mongoose.Schema({
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
        default: null
    },
    
    isActive: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

export default mongoose.model("Room", roomShema);