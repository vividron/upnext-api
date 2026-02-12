import { Spotify } from "arctic";

export const spotify = new Spotify(
  process.env.SPOTIFY_CLIENT_ID,
  process.env.SPOTIFY_CLIENT_SECRET,
  `${process.env.API_BASE_URL}/api/auth/spotify/callback`
);

