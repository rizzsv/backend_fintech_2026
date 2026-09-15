import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    OtpPurpose,
} from "@prisma/client";

import {
    otpService,
} from "../services/otp.service";

export class OtpController {

    /**
     * POST /otp/generate
     */
    async generate(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const userId =
                req.user?.id;

            if (!userId) {

                res.status(401).json({

                    success: false,

                    message:
                        "Unauthorized",

                });

                return;
            }

            const {
                purpose,
            } = req.body;

            if (!purpose) {

                res.status(400).json({

                    success: false,

                    message:
                        "OTP purpose is required",

                });

                return;
            }

            if (
                !Object.values(
                    OtpPurpose
                ).includes(purpose)
            ) {

                res.status(400).json({

                    success: false,

                    message:
                        "Invalid OTP purpose",

                });

                return;
            }

            const result =
                await otpService.generate({

                    userId,

                    purpose,

                });

            res.status(200).json({

                success: true,

                message:
                    "OTP sent successfully",

                data: {

                    purpose:
                        result.purpose,

                    expiresAt:
                        result.expiresAt,

                },

            });

        } catch (error) {

            next(error);

        }
    }

    /**
     * POST /otp/verify
     */
    async verify(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const userId =
                req.user?.id;

            if (!userId) {

                res.status(401).json({

                    success: false,

                    message:
                        "Unauthorized",

                });

                return;
            }

            const {
                purpose,
                otp,
            } = req.body;

            if (!purpose) {

                res.status(400).json({

                    success: false,

                    message:
                        "OTP purpose is required",

                });

                return;
            }

            if (!otp) {

                res.status(400).json({

                    success: false,

                    message:
                        "OTP is required",

                });

                return;
            }

            if (
                !Object.values(
                    OtpPurpose
                ).includes(purpose)
            ) {

                res.status(400).json({

                    success: false,

                    message:
                        "Invalid OTP purpose",

                });

                return;
            }

            const result =
                await otpService.verify({

                    userId,

                    purpose,

                    otp,

                });

            if (
                !result.verified
            ) {

                res.status(400).json({

                    success: false,

                    message:
                        result.reason ??
                        "Invalid OTP",

                });

                return;
            }

            res.status(200).json({

                success: true,

                message:
                    "OTP verified successfully",

                data: {

                    verified:
                        true,

                    purpose:
                        result.purpose,

                    verifiedAt:
                        result.verifiedAt,

                },

            });

        } catch (error) {

            next(error);

        }
    }
}

export const otpController =
    new OtpController();
