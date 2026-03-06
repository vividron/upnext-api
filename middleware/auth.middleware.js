import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { spotify } from '../config/oauth.js';
import AppError from '../utils/appError.js';

export const protect = async (req, res, next) => {

    // check if token exist in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Extract token 
            const token = req.headers.authorization.split(' ')[1];
            const decode = jwt.verify(token, process.env.JWT_SECRET);

            req.userId = decode.userId;
            next();
        }
        catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: "INVALID_TOKEN",
                        message: "Token expired"
                    }
                });
            }

            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Not authorized, invalid token"
                }

            });
        }

    } else {
        res.status(401).json({
            success: false,
            error: {
                code: "INVALID_TOKEN",
                message: "token not found"
            }
        });
    }
}

export const validateAccessToken = async (req, res, next) => {

    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_USER_ID",
                    message: "User not found. invalid user Id"
                }
            });
        }

        // Check if token expired. refresh 60s before actual expiry 
        if (new Date().getTime() >= new Date(user.tokenExpiresAt).getTime() - 60000) {
            // refresh token
            const tokens = await spotify.refreshAccessToken(user.refreshToken);
            user.accessToken = tokens.accessToken();
            user.tokenExpiresAt = tokens.accessTokenExpiresAt();

            if (tokens.refreshToken) {
                user.refreshToken = tokens.refreshToken();
            }

            await user.save();
        }

        req.accessToken = user.accessToken;
        req.userSpotifyId = user.spotifyId

        next();
    } catch (error) {
        next(new AppError("Access token validation failed", "ACCESS_TOKEN_VALIDATION", 400, error));
    }
}