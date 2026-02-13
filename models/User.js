import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  profileImage: {
    type: String
  },
  isPremium: {
    type: Boolean
  },

  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiresAt: {
    type: Date,
    required: true
  }
});

export default mongoose.model("User", userSchema);
