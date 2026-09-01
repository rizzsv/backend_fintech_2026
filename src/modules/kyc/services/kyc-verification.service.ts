import {
    KycStatus,
} from "@prisma/client";

import { KycAiVerificationProvider } from "../ai/kyc-ai-verification.types";
import { MockKycAiVerificationProvider } from "../ai/kyc-ai-verification.provider";
import { PrismaKycRepository } from "../repositories/prisma-kyc.repository";
import { KycRepository } from "../repositories/kyc.repository";

export class KycVerificationService {
    constructor(
        private readonly kycRepository: KycRepository,
        private readonly aiProvider: KycAiVerificationProvider
    ) {}

    async verify(kycId: string) {
        const kyc = await this.kycRepository.findById(kycId);

        if (!kyc) {
            throw new Error(`KYC with ID ${kycId} not found`);
        }

        if (kyc.status !== KycStatus.PENDING) {
            throw new Error("Only pending KYC can be verified");
        }

        const result = await this.aiProvider.verify({
            documentPath: kyc.documentPath ?? "",
            selfiePath: kyc.selfiePath ?? "",
        });

        const nextStatus = result.verified ? KycStatus.VERIFIED : KycStatus.REJECTED;

        const updated = await this.kycRepository.update(kyc.id, {
            status: nextStatus,
            reviewNote: result.reason || (result.verified ? "Verification passed" : "Verification failed"),
            reviewedAt: new Date(),
        });

        return {
            kycId: updated.id,
            status: updated.status,
            verified: result.verified,
            score: result.score,
            reason: result.reason,
            metadata: result.metadata,
        };
    }
}

export const kycVerificationService = new KycVerificationService(
    new PrismaKycRepository(),
    new MockKycAiVerificationProvider()
);