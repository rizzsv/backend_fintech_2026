import {
    KycAiVerificationInput,
    KycAiVerificationProvider,
    KycAiVerificationResult,
} from "./kyc-ai-verification.types";

export class MockKycAiVerificationProvider
    implements KycAiVerificationProvider {
    async verify(
        input: KycAiVerificationInput
    ): Promise<KycAiVerificationResult> {
        if (!input.documentPath || !input.selfiePath) {
            return {
                verified: false,
                score: 0,
                reason: "Incomplete KYC documents",
            };
        }

        return {
            verified: true,
            score: 0.95,
            reason: "Verification passed",
            metadata: {
                provider: "mock",
                documentMatched: true,
                faceMatched: true,
                livenessPassed: true,
            },
        };
    }
}

export const kycAiVerificationProvider: KycAiVerificationProvider =
    new MockKycAiVerificationProvider();
