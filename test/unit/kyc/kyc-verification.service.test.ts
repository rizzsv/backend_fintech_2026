import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from "vitest";

import {
    KycStatus,
} from "@prisma/client";

import {
    KycVerificationService,
} from "../../../src/modules/kyc/services/kyc-verification.service";

describe(
    "KycVerificationService",
    () => {
        const repository = {
            findById: vi.fn(),
            update: vi.fn(),
        } as any;

        const aiProvider = {
            verify: vi.fn(),
        } as any;

        const service =
            new KycVerificationService(
                repository,
                aiProvider
            );

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            "should approve KYC when AI verification passes",
            async () => {
                repository.findById
                    .mockResolvedValue({
                        id: "kyc-123",
                        userId: "user-123",
                        documentPath: "documents/ktp.jpg",
                        selfiePath: "selfies/selfie.jpg",
                        status: KycStatus.PENDING,
                    });

                aiProvider.verify
                    .mockResolvedValue({
                        verified: true,
                        score: 0.95,
                        reason: "Verification passed",
                        metadata: {
                            provider: "mock",
                        },
                    });

                repository.update
                    .mockResolvedValue({
                        id: "kyc-123",
                        status: KycStatus.APPROVED,
                    });

                const result =
                    await service.verify(
                        "kyc-123"
                    );

                expect(
                    aiProvider.verify
                ).toHaveBeenCalledWith({
                    documentPath: "documents/ktp.jpg",
                    selfiePath: "selfies/selfie.jpg",
                });

                expect(
                    repository.update
                ).toHaveBeenCalled();

                expect(
                    result.verified
                ).toBe(true);

                expect(
                    result.status
                ).toBe(
                    KycStatus.APPROVED
                );
            }
        );

        it(
            "should reject KYC when AI verification fails",
            async () => {
                repository.findById
                    .mockResolvedValue({
                        id: "kyc-123",
                        userId: "user-123",
                        documentPath: "documents/ktp.jpg",
                        selfiePath: "selfies/selfie.jpg",
                        status: KycStatus.PENDING,
                    });

                aiProvider.verify
                    .mockResolvedValue({
                        verified: false,
                        score: 0.25,
                        reason: "Face mismatch",
                    });

                repository.update
                    .mockResolvedValue({
                        id: "kyc-123",
                        status: KycStatus.REJECTED,
                    });

                const result =
                    await service.verify(
                        "kyc-123"
                    );

                expect(
                    result.verified
                ).toBe(false);

                expect(
                    result.status
                ).toBe(
                    KycStatus.REJECTED
                );
            }
        );

        it(
            "should reject verification for non-pending KYC",
            async () => {
                repository.findById
                    .mockResolvedValue({
                        id: "kyc-123",
                        status: KycStatus.APPROVED,
                    });

                await expect(
                    service.verify(
                        "kyc-123"
                    )
                ).rejects.toThrow(
                    "Only pending KYC can be verified"
                );

                expect(
                    aiProvider.verify
                ).not.toHaveBeenCalled();
            }
        );
    }
);
