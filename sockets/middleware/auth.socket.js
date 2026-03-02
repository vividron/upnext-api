import jwt from "jsonwebtoken";

export const socketAuth = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token ||
            socket.handshake.query?.token;;
        if (!token) {
            const err = new Error("Token not found");
            err.code = "INVALID_TOKEN";
            return next(err);
        };

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decode.userId;
        return next();

    } catch (err) {
        const error = new Error("Not authorized");
        error.code = "INVALID_TOKEN";
        if (err.name === "TokenExpiredError") error.message = "Token expired";
        next(error);
    }
}