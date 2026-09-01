import {
    describe,
    it,
    expect,
} from "vitest";

import {
    MockKycAiVerificationProvider,
} from "../../../src/modules/kyc/ai/mock-kyc-ai-verification.provider";

describe(
    "MockKycAiVerificationProvider",
    () => {
        const provider =
            new MockKycAiVerificationProvider();

        it(
            "should verify valid KYC documents",
            async () => {
                const result =
                    await provider.verify({
                        documentPath:
                            "user/documents/ktp.jpg",
                        selfiePath:
                            "user/selfies/selfie.jpg",
                    });

                expect(
                    result.verified
                ).toBe(true);

                expect(
                    result.score
                ).toBe(0.95);

                expect(
                    result.metadata
                ).toEqual({
                    provider: "mock",
                    documentMatched: true,
                    faceMatched: true,
                    livenessPassed: true,
                });
            }
        );

        it(
            "should reject incomplete documents",
            async () => {
                const result =
                    await provider.verify({
                        documentPath: "",
                        selfiePath:
                            "user/selfies/selfie.jpg",
                    });

                expect(
                    result.verified
                ).toBe(false);

                expect(
                    result.score
                ).toBe(0);
            }
        );
    }
);
