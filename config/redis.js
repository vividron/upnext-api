import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    retryStrategy(times) {
        console.log(`Redis reconnect attempt ${times}`);
        return 5000; // add 5s delay
    },
});

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("error", (err) => {
    console.error("Redis error:", err.message);
});

redis.on("end", () => {
    console.error("Redis disconnected");
    process.exit(1);
});

export default redis;