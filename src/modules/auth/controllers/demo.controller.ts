import { Request, Response, NextFunction } from 'express';
import { demoService } from '../services/demo.service';
import { AppError } from '../../../shared/errors/AppError';

export class DemoController {
    async createDemoAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await demoService.createDemoAccount();

            res.status(201).json({
                success: true,
                message: 'Demo account created successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async resetDemoAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
            }

            const result = await demoService.resetDemoAccount(userId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const demoController = new DemoController();
