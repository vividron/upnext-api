import jwt from "jsonwebtoken";
import AppError from "../../utils/appError.js";

export const socketAuth = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) next(new AppError("Token not found", "INVALID_TOKEN", null));

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decode.userId;
        return next();

    } catch (err) {
        if (err.name === "TokenExpiredError") next(new AppError("Token expired", "TOKEN_EXPIRED", null));
        next(new AppError("Not authorized", "INVALID_TOKEN", null, err));
    }
}