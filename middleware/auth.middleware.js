import jwt from 'jsonwebtoken';

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