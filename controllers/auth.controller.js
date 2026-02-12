import { generateCodeVerifier, generateState } from "arctic";
import { spotify } from "../config/oauth.js";
import axios from "axios";
import User from "../models/User.js";
import jwt from "jsonwebtoken"
import asyncWrapper from "../utils/asyncWrapper.js";

const scopes = [
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "playlist-read-private",
    "playlist-read-collaborative"
];

export const redirectToSpotifyAuth = asyncWrapper(async (req, res) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = spotify.createAuthorizationURL(
        state,
        codeVerifier,
        scopes
    );

    res.cookie("state", state, { httpOnly: true });
    res.cookie("code_verifier", codeVerifier, { httpOnly: true });

    res.redirect(url.toString());
});

export const handleSpotifyCallback = asyncWrapper(async (req, res) => {
    const { code, state } = req.query;

    const storedState = req.cookies?.state;
    const codeVerifier = req.cookies?.code_verifier;

    if (state !== storedState || !codeVerifier) {
        return res.status(400).json({ message: "Invalid OAuth state" });
    }

    const tokens = await spotify.validateAuthorizationCode(code, codeVerifier);

    const accessToken = tokens.accessToken();

    const { data: spotifyUser } = await axios.get(
        "https://api.spotify.com/v1/me",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    const spotifyId = spotifyUser.id;
    const isPremium = spotifyUser.product === "premium";

    if (!spotifyId) {
        return res.status(502).json({ message: "Missing spotify user ID" });
    }

    // Find or create user
    let user = await User.findOne({ spotifyId });

    if (!user) {
        user = await User.create({
            spotifyId,
            username: spotifyUser.display_name,
            email: spotifyUser.email,
            profileImage: spotifyUser.images?.[0]?.url,
            isPremium,
            accessToken,
            refreshToken: tokens.refreshToken(),
            tokenExpiresAt: tokens.accessTokenExpiresAt()
        });
    } else {
        user.username = spotifyUser.display_name;
        user.email = spotifyUser.email;
        user.profileImage = spotifyUser.images?.[0]?.url;
        user.isPremium = isPremium;
        user.accessToken = accessToken;
        user.refreshToken = tokens.refreshToken(),
            user.tokenExpiresAt = tokens.accessTokenExpiresAt();
        await user.save();
    }

    // Issue JWT
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.clearCookie("state");
    res.clearCookie("code_verifier");
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
})
