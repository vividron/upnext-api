import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    votes: [
        {
            songId: {
                type: String,
                required: true
            },
            vote: {
                type: Number, // +1 or -1
                required: true
            },
            _id: false
        }
    ]
});

voteSchema.index({ userId: 1 });

export default mongoose.model("Vote", voteSchema);