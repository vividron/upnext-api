export const errorHandler = (err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || "INTERNAL_SERVER_ERROR",
            message: err.message
        }
    });
};
