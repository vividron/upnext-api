import AppError from "../utils/appError.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import * as queueService from "../services/queue.service.js"

export const addPlaylistToQueue = asyncWrapper(async (req, res) => {
    const { roomId } = req.params;
    const { songs } = req.body

    if (!songs && !Array.isArray(songs) && songs.length === 0) throw new AppError("Invalid songs format or empty playlist", "INVALID_SONGS_INPUT", 400)

    await queueService.addPlaylistToQueue(roomId, songs);

    res.status(200).json({
        success: true,
        message: "Playlist added to queue successfully"
    });
});

export const upvoteMatchedSongs = asyncWrapper(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.userId;
    const songIds = req.songIds;

    await queueService.upvoteMatchedSongs(roomId, userId, songIds);

    res.status(200).json({
        success: true,
        message: "Successfully upvoted songs"
    });
})

export const clearQueue = asyncWrapper(async (req, res) => {
    const { roomId } = req.params;

    await queueService.clearQueue(roomId);

    res.status(200).json({
        success: true,
        message: "Queue cleared successfully"
    });
});