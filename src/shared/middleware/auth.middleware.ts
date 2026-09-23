import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from "../utils/token.utils";
import { AuthError } from "../errors/AuthError";
import { authRepository } from '../../modules/auth/repositories/auth.repository';

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AuthError(
                "Unauthorized",
                "UNAUTHORIZED",
                401
            );
        }

        const token = authHeader.replace("Bearer ", "");

        let payload: { sub: string; sessionId: string };

        try {
            payload = verifyAccessToken(token);
        } catch (error) {
            /**
             * A rejected token is a client error, not a server fault. Without
             * this mapping the raw jsonwebtoken error escapes to the global
             * error handler, which has no case for it and answers 500.
             */
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthError(
                    "TokenExpired",
                    "TOKEN_EXPIRED",
                    401
                );
            }

            throw new AuthError(
                "InvalidToken",
                "INVALID_TOKEN",
                401
            );
        }

        const session =
            await authRepository.findSessionById(
                payload.sessionId
            );

        if (!session) {
            throw new AuthError(
                "SessionNotFound",
                "UNAUTHORIZED",
                401
            );
        }

        req.user = {
            id: payload.sub,
            sessionId: payload.sessionId
        };

        next();

    } catch (error) {
        next(error);
    }
}
