import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    UserRole,
} from "@prisma/client";

import {
    userRepository,
} from "../repositories/user.repository";

export function roleGuard(
    ...allowedRoles: UserRole[]
) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }

            const role = await userRepository.findRoleById(userId);

            if (!role) {
                res.status(401).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            if (!allowedRoles.includes(role)) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden",
                });
                return;
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}
