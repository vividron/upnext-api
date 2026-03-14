import * as spotifyService from "../services/spotify.service.js";
import AppError from "../utils/appError.js";
import { getPlayerState, getQueueMaxScoreSong, getSongMeta, removeSongFromQueue, setPlayerState } from "../redis/room.redis.js";
import { getIO } from "../sockets/socket.gateway.js";

// Get playback current state
export const getPlayBackState = async (accessToken) => {
    return await spotifyService.getPlayBackState(accessToken);
}

// resume player
export const resumePlayer = async (accessToken, roomId) => {

    const io = getIO();

    // Get player state from redis 
    const playerState = await getPlayerState(roomId);

    // Get ID of currently playing song.
    const currentSongId = playerState.song.songId;

    if (!currentSongId) throw new AppError("Invalid song Id", "INVALID_SONG_ID", 400);

    // position of the seek bar
    const position = playerState?.position ?? 0;

    await spotifyService.playTrack(accessToken, currentSongId, position);

    io.to(roomId).emit("player-resumed");

    playerState.startedAt = Date.now();
    playerState.isPlaying = true;

    await setPlayerState(roomId, playerState);
}

// pause player
export const pausePlayer = async (accessToken, roomId) => {

    const io = getIO();

    // Get player state
    const playerState = await getPlayerState(roomId);

    if (!playerState.isPlaying) throw new AppError("Song already paused", "INVALID_COMMAND", 400);

    await spotifyService.pausePlayer(accessToken);

    io.to(roomId).emit("player-paused");

    // update position. current position = position of seek bar when started playing + time passed
    const currPosition = playerState.position + (Date.now() - playerState.startedAt);

    playerState.position = currPosition;
    playerState.startedAt = null;
    playerState.isPlaying = false;

    await setPlayerState(roomId, playerState);
}

// play next song from queue
export const playNext = async (accessToken, roomId) => {

    const io = getIO();

    // Get top song from the queue. [songId, score]
    const maxScoreSong = await getQueueMaxScoreSong(roomId);

    // Check if queue is empty
    if(maxScoreSong.length === 0) throw new AppError("Can't perform this action. Queue is empty", "EMPTY_QUEUE", 403);

    const songId = maxScoreSong[0];

    await spotifyService.playTrack(accessToken, songId, 0);

    io.to(roomId).emit("next-song", { songId });

    // remove song from the queue
    await removeSongFromQueue(roomId, songId);

    // Get song metadata
    const songMetaData = await getSongMeta(roomId, songId);

    await setPlayerState(roomId, { song: songMetaData, position: 0, isPlaying: true, startedAt: Date.now() });
}

// TODO - play previous song from recently played set
export const playPrevious = async (accessToken) => {
    await spotifyService.playPrevious(accessToken);
}

// seek to position
export const seekToPosition = async (accessToken, roomId, positionMs) => {

    const io = getIO();
    const playerState = await getPlayerState(roomId);

    await spotifyService.seekToPosition(accessToken, positionMs);

    // Broadcast the updated playback position to all clients in the room
    io.to(roomId).emit("seekbar-update", { positionMs });

    playerState.position = positionMs;
    if (playerState.isPlaying) playerState.startedAt = Date.now();

    await setPlayerState(roomId, playerState);
}