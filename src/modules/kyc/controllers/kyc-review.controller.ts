import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    kycReviewService,
} from "../services/kyc-review.service";

import {
    KycReviewDecision,
} from "../types/kyc-review.types";


export class KycReviewController {

    async review(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const kycIdParam =
                req.params.kycId;

            const kycId =
                Array.isArray(kycIdParam)
                    ? kycIdParam[0]
                    : kycIdParam;

            const {
                decision,
                reviewNote,
            } = req.body;


            const reviewerId =
                req.user?.id;


            if (!reviewerId) {

                res.status(401).json({
                    success: false,
                    message:
                        "Unauthorized",
                });

                return;
            }


            if (!kycId) {

                res.status(400).json({
                    success: false,
                    message:
                        "KYC ID is required",
                });

                return;
            }


            if (
                decision !==
                    KycReviewDecision.APPROVE &&
                decision !==
                    KycReviewDecision.REJECT
            ) {

                res.status(400).json({
                    success: false,
                    message:
                        "Invalid review decision",
                });

                return;
            }


            const result =
                await kycReviewService.review({
                    kycId,

                    reviewerId,

                    decision,

                    reviewNote,
                });


            res.status(200).json({
                success: true,

                message:
                    "KYC review completed",

                data: result,
            });

        } catch (error) {

            next(error);
        }
    }
}


export const kycReviewController =
    new KycReviewController();