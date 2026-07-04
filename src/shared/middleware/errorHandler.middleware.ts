import { Request, Response, NextFunction } from "express";
import { logger } from "../logger/logger";
import { AppError } from "../errors/AppError";

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {

    logger.error(
        {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            message: err.message,
            stack: err.stack,
            code: err.code,
            statusCode: err.statusCode,
        },
        "Unhandled error"
    );

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}