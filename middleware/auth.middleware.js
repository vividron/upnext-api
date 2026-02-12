import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {

    // check if token exist in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Extract token 
            const token = req.headers.authorization.split(' ')[1];
            const decode = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decode.id);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: "USER_NOT_FOUND",
                        message: "User not found"
                    },
                    statusCode: 401
                });
            }
            req.user = user;
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