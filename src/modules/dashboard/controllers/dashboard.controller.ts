import {
    Request,
    Response,
    NextFunction,
} from "express";

import { DashboardService, dashboardService } from "../services/dashboard.service";
import { AppError } from "../../../shared/errors/AppError";

export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService
    ) {}

    async getDashboard(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                throw new AppError(
                    "Unauthorized",
                    401,
                    "UNAUTHORIZED"
                );
            }

            const dashboard = await this.dashboardService.getDashboard(userId);

            res.status(200).json({
                success: true,
                message: "Dashboard fetched successfully",
                data: dashboard,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController(dashboardService);
