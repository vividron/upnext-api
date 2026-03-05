import { getSortedQueue } from "../redis/room.redis.js";

export const getQueue = async (roomId) => {
    const mixArray = await getSortedQueue(roomId);

    // Combine song and score in one single object and add it to the queue array
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