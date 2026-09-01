import { KycAiVerificationInput, KycAiVerificationProvider, KycAiVerificationResult } from "./kyc-ai-verification.types";

export class MockKycAiVerificationProvider 
 implements KycAiVerificationProvider {
    async verify(
        input: KycAiVerificationInput
    ): Promise<KycAiVerificationResult> {
        if (
            !input.documentPath || 
            !input.selfiePath
        ) {
            return {
                verified: false,
                score: 0,
                reason: "Missing document or selfie path",
            };
        }

        return {
            verified: true,
            score: 0.95,
            reason: "Mock verification successful",
            metadata: {
                provider: "MockKycAiVerificationProvider",
                documentPath: true,
                faceMatched: true,
                livenessPassed: true,
            }
        }
    }
 }

 export const kycAiVerificationProvider: KycAiVerificationProvider = new MockKycAiVerificationProvider();