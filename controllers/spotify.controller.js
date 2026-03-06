import asyncWrapper from "../utils/asyncWrapper.js";
import * as spotifyService from "../services/spotify.service.js"

export const getUserPlaylists = asyncWrapper(async (req, res) => {

    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;

    const playlists = await spotifyService.getUserPlaylists(req.accessToken, limit, offset);

    res.status(200).json({
        success: true,
        playlists
    });
});

export const getPlaylistItems = asyncWrapper(async (req, res) => {

    const limit = Number(req.query.limit) || 10;
    const { playlistId } = req.params;

    const items = await spotifyService.getPlaylistItems(req.accessToken, playlistId, limit);

    res.status(200).json({
        success: true,
        items
    });
});

export const getPlayBackState = asyncWrapper(async (req, res) => {

    const playbackState = await spotifyService.getPlayBackState(req.accessToken);

    res.status(200).json({
        success: true,
        playbackState
    });
});


