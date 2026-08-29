import { Request, Response, NextFunction } from "express";

import {
    kycService,
} from "../services/kyc.service";

export class KycController {

    async uploadDocuments(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            /**
             * User ID harus berasal dari
             * authenticated user.
             */
            const userId =
                req.user?.id;

            if (!userId) {

                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });

                return;
            }

            /**
             * Multer upload.fields()
             * menghasilkan req.files
             * dalam bentuk object.
             */
            const files =
                req.files as
                    Record<
                        string,
                        Express.Multer.File[]
                    >
                    | undefined;

            const document =
                files?.document?.[0];

            const selfie =
                files?.selfie?.[0];

            /**
             * Validation basic.
             *
             * Business validation tetap
             * dilakukan oleh KycService.
             */
            if (!document) {

                res.status(400).json({
                    success: false,
                    message:
                        "KYC document is required",
                });

                return;
            }

            if (!selfie) {

                res.status(400).json({
                    success: false,
                    message:
                        "Selfie is required",
                });

                return;
            }

            const result =
                await kycService.uploadDocuments({
                    userId,

                    document,

                    selfie,
                });

            res.status(201).json({
                success: true,

                message:
                    "KYC documents uploaded successfully",

                data: result,
            });

        } catch (error) {

            next(error);
        }
    }
}

export const kycController =
    new KycController();
