import asyncWrapper from "../utils/asyncWrapper.js";
import * as playerService from "../services/player.service.js"

// Get playback current state
export const getPlayBackState = asyncWrapper(async (req, res) => {

    const playbackState = await playerService.getPlayBackState(req.accessToken);

    res.status(200).json({
        success: true,
        playbackState
    });
});

// resume player
export const resumePlayer = asyncWrapper(async (req, res) => {

    const { roomId } = req.params

    await playerService.resumePlayer(req.accessToken, roomId);

    res.status(200).json({
        success: true,
        message: "Playback resumed"
    });
});

// pause player
export const pausePlayer = asyncWrapper(async (req, res) => {

    const { roomId } = req.params
    const { isStateSync } = req.body;

    await playerService.pausePlayer(req.accessToken, roomId, isStateSync);

    res.status(200).json({
        success: true,
        message: "Playback paused"
    });
});

// play next song from queue
export const playNext = asyncWrapper(async (req, res) => {

    const { roomId } = req.params;

    await playerService.playNext(req.accessToken, roomId);

    res.status(200).json({
        success: true,
        message: "Next song is now playing"
    });
});

// play previous song from recently played set
export const playPrevious = asyncWrapper(async (req, res) => {

    await playerService.playPrevious(req.accessToken);

    res.status(200).json({
        success: true,
        message: "Previous song is now playing"
    });
});

// seek to position
export const seekToPosition = asyncWrapper(async (req, res) => {

    const { roomId } = req.params
    const { positionMs } = req.body;

    await playerService.seekToPosition(req.accessToken, roomId, positionMs);

    res.status(200).json({
        success: true,
        message: "Playback position updated"
    });
});