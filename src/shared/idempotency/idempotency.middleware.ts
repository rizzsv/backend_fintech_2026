import {Request, Response, NextFunction} from 'express';
import {idempotencyService} from "./idempotency.service";

export async function idempotencyMiddleware (
    req: Request,
    res: Response,
    next: NextFunction
) {
    const key = req.headers["idempotency-key"] 

    if (!key) {
        return res
        .status(400)
        .json({
            message: "idempotency-key header is required"
        })
    }

    const existing = await idempotencyService.get(key.toString());

    if (existing) {
        return res.json(
            existing
        )
    }

    const originalJson = res.json

    res.json = function (body: any) {
        idempotencyService.set(
            key.toString(),
            body
        );

        return originalJson.call(this, body);
    };

    next();
}

