import { Request, Response, NextFunction } from 'express';
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

        console.log("========== AUTH DEBUG ==========");
        console.log("AUTH HEADER:", authHeader);

        if (!authHeader) {
            throw new AuthError(
                "Unauthorized",
                "UNAUTHORIZED",
                401
            );
        }

        const token = authHeader.replace("Bearer ", "");

        console.log("TOKEN:", token);

        const payload = verifyAccessToken(token);

        console.log("PAYLOAD:", payload);

        const session =
            await authRepository.findSessionById(
                payload.sessionId
            );

        console.log("SESSION:", session);

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

        console.log("AUTH SUCCESS");
        console.log("================================");

        next();

    } catch (error) {

        console.error("========== AUTH ERROR ==========");
        console.error(error);
        console.error("================================");

        next(error);
    }
}