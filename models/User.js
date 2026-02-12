import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  spotifyId: String,
  username: String,
  email: String,
  profileImage: String,
  isPremium: Boolean,

  accessToken: String,
  refreshToken: String,
  tokenExpiresAt: Date
});

export default mongoose.model("User", userSchema);
