import {Request, Response, NextFunction} from "express";
import {AuthError} from "../errors/AuthError";
import { sessionRepository } from "../../modules/auth/repositories/session.repository";

export const require2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AuthError("Unauthorized");
        }

        const session = await sessionRepository.findById(
            req.user.sessionId
        )

        if (!session) {
            throw new AuthError("SessionNotFound");
        }

        if(!session.is2FAVerified) {
            throw new AuthError("Unauthorized");
        }

        next();
    }catch (error) {
        next(error);
    }
}