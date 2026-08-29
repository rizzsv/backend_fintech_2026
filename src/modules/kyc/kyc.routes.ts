import {
    Router,
} from "express";

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

export default router;
