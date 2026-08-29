import rateLimit from "express-rate-limit";

export const kycUploadRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "Too many KYC upload attempts. Please try again later.",
    },
});
