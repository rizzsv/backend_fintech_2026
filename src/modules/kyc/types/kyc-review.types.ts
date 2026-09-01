import { KycStatus } from "@prisma/client";

export enum KycReviewDecision {
    APPROVE = "APPROVE",
    REJECT = "REJECT",
}

export interface ManualKycReviewInput {
    kycId: string;
    reviewerId: string;
    decision: KycReviewDecision;
    reviewNote?: string;
}

export interface ManualKycReviewResponse {
    id: string;
    userId: string;
    status: KycStatus;
    reviewNote: string | null;
    reviewedAt: Date | null;
}