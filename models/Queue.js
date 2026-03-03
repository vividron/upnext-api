import mongoose from "mongoose";

const queueSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },

    songs: [
        {
            songId: {
                type: String,
                default: null
            },
            name: {
                type: String,
                default: null
            },
            coverImage: {
                type: String,
                default: null
            },
            artists: [String],

            duration: {
                type: Number,
                default: null
            },

            score: {
                type: Number,
                default: 0
            },

            voters: [
                {
                    userId: mongoose.Schema.Types.ObjectId,
                    vote: Number // +1 or -1
                }
            ]
        }
    ],
}, {
    timestamps: true
});

queueSchema.index({roomId: 1});

export default mongoose.model("Queue", queueSchema);