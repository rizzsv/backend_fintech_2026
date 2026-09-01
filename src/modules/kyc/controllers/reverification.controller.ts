import { Request, Response, NextFunction } from "express";
import {ReverificationTrigger} from "../types/reverification.types"
import { reverificationService } from "../services/reverification.service";

export class ReverificationController {
    async trigger(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            let { kycId } = req.params;

            // Handle case where kycId might be an array
            if (Array.isArray(kycId)) {
                kycId = kycId[0];
            }

            const kycIdString = kycId as string;

            const {
                userId,
                trigger,
                reason,
                metadata,
            } = req.body;

            if (!kycIdString) {
                res.status(400).json({
                    success: false,
                    message: "KYC ID is required",
                });

                return;
            }

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: "User ID is required",
                });

                return;
            }

            if (
                !Object.values(
                    ReverificationTrigger
                ).includes(trigger)
            ) {
                res.status(400).json({
                    success: false,
                    message: "Invalid trigger type",
                })

                return;
            }

            const result = await reverificationService.trigger({
                kycId: kycIdString,
                userId,
                trigger,
                reason,
                metadata,
            })

            res.status(200).json({
                success: true,
                message: result.triggered ? "Reverification triggered successfully" : "No status change required for KYC request in PENDING state.",
                data: result,
            })
        }catch (error) {
            next(error);
        }
    }
}

export const reverificationController =
    new ReverificationController();