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

    playerState: {
        song: {
            id: {
                type: String,
                default: null
            },
            name: {
                type: String,
                default: null
            },
            artists: [String],
            image: {
                type: String,
                default: null
            },
            duration: {
                type: Number,
                default: null
            }
        },
        isPlaying: {
            type: Boolean,
            default: false
        },
        position: {
            type: Number,
            default: 0
        }
    },

    isActive: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

export default mongoose.model("Room", roomShema);