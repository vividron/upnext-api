import fs from "fs"
import path from "path";
import { fileURLToPath } from "url";
import redis from "../config/redis.js"
import { roomKeys } from "../redis/keys.js";
import { checkVoteLimitExist, setVoteLimit } from "../redis/queue.redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const voteScript = fs.readFileSync(path.resolve(__dirname, "../redis/scripts/vote.lua"), "utf8");
const batchVoteScript = fs.readFileSync(path.resolve(__dirname, "../redis/scripts/batchVoteSongs.lua"), "utf8");

// Vote song
export const voteSongAtomic = async (roomId, userId, songId, vote) => {

    const result = await redis.eval(
        voteScript,
        2,
        roomKeys.queue(roomId),
        roomKeys.userVotes(roomId, userId),
        songId,
        vote
    )

    return {
        delta: Number(result[0]),
        score: Number(result[1])
    }
}

// upvote matched songs 
export const batchVoteSongs = async (roomId, userId, songIds)=> {

    const result = await redis.eval(
        batchVoteScript,
        2,
        roomKeys.queue(roomId),
        roomKeys.userVotes(roomId, userId),
        ...songIds
    )

    return result
}

// limit spam votes
export const voteLimiter = async (roomId, userId) => {

    const exists = await checkVoteLimitExist(roomId, userId);

    if (exists) return false;

    await setVoteLimit(roomId, userId);

    return true;
};
