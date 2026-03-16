import { checkBatchVoteLimit, increBatchVoteCount, setBatchVoteLimit } from "../redis/queue.redis.js";
import { filterSongsInQueue } from "../services/queue.service.js";
import { resolveRoomRole } from "../services/room.service.js";
import AppError from "../utils/appError.js";

export const batchVoteLimiter = async (req, res, next) => {

    try {
        const { roomId } = req.params;
        const userId = req.userId;

        const batchVoteCount = await checkBatchVoteLimit(roomId, userId);
        console.log("batch vote count:", batchVoteCount);

        if (!batchVoteCount) {
            await setBatchVoteLimit(roomId, userId);
            return next();
        }

        // Limit batch votes if more than 10 occur within 30 sec
        if (batchVoteCount > 10) return next(new AppError("Batch vote limit reached", "BATCH_VOTE_LIMIT_EXCEEDED", 429));

        // increment batch vote count
        await increBatchVoteCount(roomId, userId)
        next();

    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(new AppError("Batch vote limiter failed", "BATCH_VOTE_LIMIT_FAILED", 400, error));
    }
};

export const validateSongIds = async (req, res, next) => {

    try {
        const { roomId } = req.params
        const { songIds } = req.body;

        if (!Array.isArray(songIds) || songIds.length === 0) return next(new AppError("Invalid songIds format", "INVALID_FORMAT", 400));

        // Check if songIds length exceed batch upvote max votes
        if (songIds.length > 50) return next(new AppError("Maximum song vote limit reached", "MAX_SONG_VOTE_LIMIT", 400));

        // Filter songs which are present in the queue
        const filteredSongIds = await filterSongsInQueue(roomId, songIds);

        if (filteredSongIds.length === 0) return next(new AppError("Invalid songIds. Songs are not in the queue", "INVALID_SONG_IDS", 400));

        req.songIds = filteredSongIds;
        next();

    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(new AppError("Failed to validate songIds", "SONG_VALIDATION_FAILED", 400, error));
    }
}

export const validateVoter = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.userId;

        const isHost = await resolveRoomRole(roomId, userId);

        if (isHost) next(new AppError("Host cannot vote songs", "HOST_VOTE_FORBIDDEN", 403));
        next();

    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(new AppError("Failed to validate voter", "VOTER_VALIDATION_FAILED", 400, error));
    }
}