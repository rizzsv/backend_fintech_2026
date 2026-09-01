import {
    Router,
} from "express";

import {
    UserRole,
} from "@prisma/client";

import {
    roleGuard,
} from "../auth/middlewares/role.middleware";

import {
    kycController,
} from "./controllers/kyc.controller";

import {
    kycUpload,
} from "./storage/kyc-multer";

import {
    authMiddleware,
} from "../../shared/middleware/auth.middleware";

import {
    kycUploadRateLimit,
} from "./middlewares/kyc-rate-limit.middleware";
import { kycVerificationController } from "./controllers/kyc-verification.controller";
import { kycReviewController } from "./controllers/kyc-review.controller";
import { reverificationController } from "./controllers/reverification.controller";

const router =
    Router();

router.post(
    "/documents",

    authMiddleware,

    kycUploadRateLimit,

    kycUpload.fields([
        {
            name: "document",
            maxCount: 1,
        },

        {
            name: "selfie",
            maxCount: 1,
        },
    ]),

    kycController.uploadDocuments.bind(
        kycController
    )
);

router.post(
    "/:kycId/verify",

    authMiddleware,

    kycVerificationController
        .verify
        .bind(
            kycVerificationController
        )
);

router.post(
    "/:kycId/review",

    authMiddleware,

    roleGuard(UserRole.ADMIN),

    kycReviewController
        .review
        .bind(
            kycReviewController
        )
);

router.post(
    "/:kycId/trigger",

    authMiddleware,

    roleGuard(
        UserRole.ADMIN
    ),

    reverificationController
        .trigger
        .bind(
            reverificationController
        )
);

export default router;
