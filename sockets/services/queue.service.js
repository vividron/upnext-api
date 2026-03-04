import redis from "../../config/redis.js"

export const getQueue = async (roomId) => {
    const mixArray = await redis.zrevrange(
        `room:${roomId}:queue`,
        0,
        -1,
        "WITHSCORES"
    )

    // Combine song and score in one single object in queue array
    const queue = [];

    for (let i = 0; i < mixArray.length; i += 2) {
        const song = JSON.parse(mixArray[i]);

        queue.push({
            ...song,
            score: mixArray[i + 1]
        });
    }

    return queue;
}