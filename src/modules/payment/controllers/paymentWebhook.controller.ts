import { Request, Response, NextFunction } from "express";
import { paymentWebhookService } from "../services/payment.webhook.service";




class PaymentWebhookController {

    async handle(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {

            await paymentWebhookService.handle(
                req.body
            );

            return res.json({
                success: true,
            });

        } catch (error) {

            next(error);

        }

    }

}

export const paymentWebhookController =
    new PaymentWebhookController();