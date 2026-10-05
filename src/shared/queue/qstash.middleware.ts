import { Request, Response, NextFunction } from "express";
import { Receiver } from "@upstash/qstash";
import { env } from "../config/env";
import { BusinessLogger } from "../logger/business-logger";

let receiver: Receiver | null = null;

function getReceiver(): Receiver {
    if (!receiver) {
        if (!env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY) {
            throw new Error(
                "QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY must be set for signature verification"
            );
        }

        receiver = new Receiver({
            currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
            nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
        });

        BusinessLogger.info("QStash signature receiver initialized");
    }

    return receiver;
}

/**
 * Middleware to verify QStash HMAC signature
 * 
 * CRITICAL: This middleware requires the RAW request body as a string.
 * Must be used with express.text() or express.raw() middleware, NOT express.json()
 * 
 * Usage:
 *   app.use('/api/workers', express.text({ type: 'application/json' }), verifyQStashSignature);
 */
export async function verifyQStashSignature(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const signature = req.headers["upstash-signature"];

        if (!signature) {
            BusinessLogger.warn("QStash signature missing", {
                path: req.path,
                ip: req.ip,
            });
            res.status(401).json({ error: "Unauthorized: Missing QStash signature" });
            return;
        }

        // Body must be raw string for signature verification
        const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

        const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

        const receiver = getReceiver();
        
        await receiver.verify({
            signature: signature as string,
            body,
            url,
        });

        // Signature valid, parse JSON body if needed
        if (typeof req.body === "string") {
            try {
                req.body = JSON.parse(req.body);
            } catch (err) {
                BusinessLogger.error("Failed to parse QStash body as JSON", {
                    path: req.path,
                    error: err,
                });
                res.status(400).json({ error: "Invalid JSON body" });
                return;
            }
        }

        BusinessLogger.info("QStash signature verified", {
            path: req.path,
            url,
        });

        next();
    } catch (error) {
        BusinessLogger.error("QStash signature verification failed", {
            path: req.path,
            ip: req.ip,
            error: error instanceof Error ? error.message : String(error),
        });
        res.status(401).json({ error: "Unauthorized: Invalid QStash signature" });
    }
}

/**
 * Extract QStash retry metadata from headers
 */
export function getQStashRetryInfo(req: Request): {
    retryCount: number;
    retryTimestamps: number[];
} {
    const retriedHeader = req.headers["upstash-retried"];
    
    if (!retriedHeader || typeof retriedHeader !== "string") {
        return { retryCount: 0, retryTimestamps: [] };
    }

    const timestamps = retriedHeader.split(",").map((ts) => parseInt(ts.trim(), 10));
    
    return {
        retryCount: timestamps.length,
        retryTimestamps: timestamps,
    };
}
