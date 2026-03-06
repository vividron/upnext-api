import axios from "axios";

export const spotifyApi = axios.create({
    baseURL: "https://api.spotify.com/v1",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});