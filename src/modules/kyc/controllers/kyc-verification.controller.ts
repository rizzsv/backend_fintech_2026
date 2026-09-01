import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    kycVerificationService,
} from "../services/kyc-verification.service";


export class KycVerificationController {

    async verify(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const {
                kycId,
            } = req.params;


            if (!kycId) {

                res.status(400).json({
                    success: false,
                    message:
                        "KYC ID is required",
                });

                return;
            }


            const result =
                await kycVerificationService.verify(
                    kycId as string
                );


            res.status(200).json({
                success: true,

                message:
                    "KYC verification completed",

                data: result,
            });

        } catch (error) {

            next(error);
        }
    }
}


export const kycVerificationController =
    new KycVerificationController();