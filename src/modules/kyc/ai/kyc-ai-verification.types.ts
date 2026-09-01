export interface KycAiVerificationInput {
    documentPath: string;
    selfiePath: string;
}

export interface KycAiVerificationResult {
    verified: boolean;
    score: number;
    reason?: string;
    metadata?: Record<string, unknown>;
}

export interface KycAiVerificationProvider {
    verify(
        input: KycAiVerificationInput
    ): Promise<KycAiVerificationResult>;
}