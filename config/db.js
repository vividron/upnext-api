import mongoose from "mongoose";
import redis from "./redis.js";

const connectDB = async() => {
try{
    await mongoose.connect(process.env.MONGODB_URI);
    await redis.flushdb(); // clear redis on server start
    console.log("MongoDB connected successfully")
}catch(err){
    console.error("MongoDB error :", err);
    process.exit(1);
}
}

export default connectDB;