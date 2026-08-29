import { Request, Response, NextFunction } from "express";
import multer from "multer";
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

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File exceeds maximum size of 5 MB",
            });
        }

        if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
                success: false,
                message: "Too many files uploaded",
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid file upload",
        });
    }

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