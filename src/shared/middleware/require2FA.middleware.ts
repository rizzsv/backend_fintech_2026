import {Request, Response, NextFunction} from "express";
import {UnautorizedError} from "../errors/UnauthorizedError";
import { sessionRepository } from "../../modules/auth/repositories/session.repository";

export const require2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const session = await sessionRepository.findById(
            req.user.sessionId
        )

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session not found"
            });
        }

        if(!session.twoFactorVerified) {
            return res.status(401).json({
                success: false,
                message: "2FA verification required"
            });
        }
    }catch (error) {

    }
}