import { OtpPurpose } from "@prisma/client";

export interface GenerateOtpInput {
    userId: string;
    purpose: OtpPurpose;
}

export interface VerifOtpInput {
    userId: string;
    purpose: OtpPurpose;
    otp: string;
}

export interface GenerateOtpResult {
    expiresAt: Date;
    purpose: OtpPurpose;
}

export interface VerifyOtpResult {
    verified: boolean;
    purpose: OtpPurpose;
    verifiedAt?: Date;
    reason?: string;
}