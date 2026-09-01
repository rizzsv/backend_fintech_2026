import { KycStatus } from "@prisma/client";
import { KycRepository } from "../repositories/kyc.repository";
import { KycReviewDecision, ManualKycReviewInput, ManualKycReviewResponse } from "../types/kyc-review.types";
import { PrismaKycRepository } from "../repositories/prisma-kyc.repository";


export class KycReviewService {
    constructor(
        private readonly kycRepository: KycRepository
    ) {}

    async review(
        input: ManualKycReviewInput
    ): Promise<ManualKycReviewResponse> {
        const {kycId, reviewerId, decision, reviewNote} = input;

        if(!reviewerId) {
            throw new Error("Reviewer ID is required");
        }

        if (
            decision == KycReviewDecision.REJECT && !reviewNote?.trim()
        ) {
            throw new Error(
                "Review note is required when rejecting a KYC request"
            );
        }

        const kyc = await this.kycRepository.findById(kycId);

        if (!kyc) {
            throw new Error(`KYC with ID ${kycId} not found`);
        }

        if(
            kyc.status !== KycStatus.PENDING
        ) {
            throw new Error(
                "Only pending KYC requests can be reviewed"
            )
        }

        const status = decision === KycReviewDecision.APPROVE ? KycStatus.VERIFIED : KycStatus.REJECTED;

        const reviewedAt = new Date();

        const updated = await this.kycRepository.review(
            kycId,
            {
                status,
                reviewNote: reviewNote?.trim(),
                reviewedAt
            }
        );

        return {
            id: updated.id,
            userId: updated.userId,
            status: updated.status,
            reviewNote: updated.reviewNote,
            reviewedAt: updated.reviewedAt
        }
    }
}

export const kycReviewService =
    new KycReviewService(
        new PrismaKycRepository()
    );