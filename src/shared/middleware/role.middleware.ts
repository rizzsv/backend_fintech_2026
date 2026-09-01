import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    UserRole,
} from "@prisma/client";
import { prisma } from "../config/database";




export function roleGuard(
    ...allowedRoles: UserRole[]
) {

    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            const userId =
                req.user?.id;


            if (!userId) {

                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });

                return;
            }


            const user =
                await prisma.user.findUnique({
                    where: {
                        id: userId,
                    },

                    select: {
                        role: true,
                    },
                });


            if (!user) {

                res.status(401).json({
                    success: false,
                    message: "User not found",
                });

                return;
            }


            if (
                !allowedRoles.includes(
                    user.role
                )
            ) {

                res.status(403).json({
                    success: false,
                    message:
                        "Forbidden",
                });

                return;
            }


            next();

        } catch (error) {

            next(error);
        }
    };
}