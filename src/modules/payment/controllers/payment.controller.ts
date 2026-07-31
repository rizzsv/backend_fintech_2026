import { Request, Response, NextFunction } from "express";

import { paymentService } from "../services/payment.service";

class PaymentController {

    async createPayment(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {

            const result =
                await paymentService.createPayment(
                    req.user!.id,
                    req.body
                );

            return res.status(201).json({
                success: true,
                data: result,
            });

        } catch (error) {
            next(error);
        }
    }

    async getStatus(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result =
                await paymentService.getStatus(
                    req.params.reference as string
                );

            return res.json({
                success: true,
                data: result,
            });

        } catch (error) {
            next(error);
        }
    }

    async cancelPayment(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {

            const result =
                await paymentService.cancelPayment(
                    req.params.reference as string
                );

            return res.json({
                success: true,
                data: result,
            });

        } catch (error) {
            next(error);
        }
    }

}

export const paymentController =
    new PaymentController();