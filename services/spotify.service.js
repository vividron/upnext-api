import { spotifyApi } from "../config/axios.js";
import AppError from "../utils/appError.js";

const getAuthHeader = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// Get user playlist
export const getUserPlaylists = async (accessToken, limit = 10, offset = 0) => {
    try {
        const res = await spotifyApi.get("/me/playlists", {
            ...getAuthHeader(accessToken),
            params: { limit, offset },
        });

        const playlists = res.data.items.map((playlist) => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist?.description ?? null,
            image: playlist.images?.[0]?.url ?? null,
            owner: playlist.owner.display_name,
            totalSongs: playlist?.items.total ?? 0,
            public: playlist.public,
            collaborative: playlist.collaborative,
        }));

        return playlists;

    } catch (error) {
        const err = error.response?.data?.error ?? null;
        throw new AppError(err?.message || "Failed to fetch user playlists", "SPOTIFY_API", err?.status, err);
    }
};

// Get playlist items
export const getPlaylistItems = async (accessToken, playlistId, limit = 50) => {
    try {
        const res = await spotifyApi.get(`/playlists/${playlistId}/items`, {
            ...getAuthHeader(accessToken),
            params: { limit },
        });

        const items = res.data.items.map((item) => ({
            songId: item.item.id,
            name: item.item.name,
            coverImage: item.item.album?.images?.[0]?.url || null,
            artists: item.item.artists?.map(a => a.name) || [],
            duration: item.item.duration_ms
        }));

        return items;

    } catch (error) {
        const err = error.response?.data?.error ?? null;
        throw new AppError(err.message || "Failed to fetch playlist items", "SPOTIFY_API", err?.status, err);
    }
};

// Get playback state
export const getPlayBackState = async (accessToken) => {
    try {
        const res = await spotifyApi.get(`/me/player`, {
            ...getAuthHeader(accessToken)
        });

        const data = res.data;

        if (!data) return null;

        return {
            device: {
                id: data.device?.id || null,
                name: data.device?.name || null,
                type: data.device?.type || null,
                volume: data.device?.volume_percent ?? null
            },
            isPlaying: data.is_playing ?? false,
            progress: data.progress_ms ?? 0,
            startedAt: data.timestamp ?? null
        };

    } catch (error) {
        const err = error.response?.data?.error ?? null;
        throw new AppError(err.message || "Failed to fetch playback state", "SPOTIFY_API", err?.status, err);
    }
}

// Play track 
export const playTrack = async (accessToken, songId, position = 0, deviceId = null) => {
    try {
        await spotifyApi.put("/me/player/play",
            {
                uris: [`spotify:track:${songId}`],
                position_ms: position
            },
            {
                ...getAuthHeader(accessToken),
                params: {
                    device_id: deviceId ? { device_id: deviceId } : {}
                }
            }
        );

        return true;

    } catch (error) {
        const err = error.response?.data?.error ?? null;
        throw new AppError(err?.message || "Failed to play track", "SPOTIFY_API", err?.status, err);
    }
};

// pause player
export const pausePlayer = async (accessToken, deviceId = null) => {
    try {
        await spotifyApi.put("/me/player/pause", {}, {
            ...getAuthHeader(accessToken),
            params: deviceId ? { device_id: deviceId } : {},
        });

        return true;

    } catch (error) {
        const err = error.response?.data?.error ?? null;
        throw new AppError(err?.message || "Failed to pause track", "SPOTIFY_API", err?.status, err);
    }
};

// Play previous song
export const playPrevious = async (accessToken) => {
    try {
        await spotifyApi.post("/me/player/previous", {}, getAuthHeader(accessToken));

        return true;

    } catch (error) {
        const err = error.response?.data?.error ?? null;
        throw new AppError(err?.message || "Failed to play previous track", "SPOTIFY_API", err?.status, err);
    }
};

// Seek to position
export const seekToPosition = async (accessToken, positionMs) => {
    try {
        await spotifyApi.put("/me/player/seek", {}, {
            ...getAuthHeader(accessToken),
            params: { position_ms: positionMs ?? 0 }
        });

        return true;

    } catch (error) {
        const err = error.response?.data?.error ?? null;
        throw new AppError(err?.message || "Failed to seek position", "SPOTIFY_API", err?.status, err);
    }
};
