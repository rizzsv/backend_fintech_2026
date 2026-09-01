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
    ReverificationService,
} from "../../../src/modules/kyc/services/reverification.service";

import {
    ReverificationTrigger,
} from "../../../src/modules/kyc/types/reverification.types";

describe(
    "ReverificationService",
    () => {

        const repository = {

            findById:
                vi.fn(),

            resetForReverification:
                vi.fn(),

        };

        const auditService = {

            log:
                vi.fn()
                    .mockResolvedValue(undefined),

        };

        const service =
            new ReverificationService(
                repository as any,
                auditService
            );

        beforeEach(() => {

            vi.clearAllMocks();

        });

        it(
            "triggers reverification for approved KYC",
            async () => {

                repository.findById
                    .mockResolvedValue({

                        id:
                            "kyc-123",

                        userId:
                            "user-123",

                        status:
                            KycStatus.APPROVED,

                    });

                repository
                    .resetForReverification
                    .mockResolvedValue({

                        id:
                            "kyc-123",

                        userId:
                            "user-123",

                        status:
                            KycStatus.PENDING,

                    });

                const result =
                    await service.trigger({

                        kycId:
                            "kyc-123",

                        userId:
                            "user-123",

                        trigger:
                            ReverificationTrigger
                                .RISK_SCORE_INCREASED,

                        reason:
                            "Risk score increased",

                    });

                expect(
                    result.triggered
                ).toBe(true);

                expect(
                    result.previousStatus
                ).toBe(
                    KycStatus.APPROVED
                );

                expect(
                    result.currentStatus
                ).toBe(
                    KycStatus.PENDING
                );

                expect(
                    repository
                        .resetForReverification
                ).toHaveBeenCalled();

                expect(
                    auditService.log
                ).toHaveBeenCalled();
            }
        );

        it(
            "does nothing when KYC is already pending",
            async () => {

                repository.findById
                    .mockResolvedValue({

                        id:
                            "kyc-123",

                        userId:
                            "user-123",

                        status:
                            KycStatus.PENDING,

                    });

                const result =
                    await service.trigger({

                        kycId:
                            "kyc-123",

                        userId:
                            "user-123",

                        trigger:
                            ReverificationTrigger
                                .DEVICE_CHANGED,

                    });

                expect(
                    result.triggered
                ).toBe(false);

                expect(
                    repository
                        .resetForReverification
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "rejects reverification for rejected KYC",
            async () => {

                repository.findById
                    .mockResolvedValue({

                        id:
                            "kyc-123",

                        userId:
                            "user-123",

                        status:
                            KycStatus.REJECTED,

                    });

                await expect(
                    service.trigger({

                        kycId:
                            "kyc-123",

                        userId:
                            "user-123",

                        trigger:
                            ReverificationTrigger
                                .PROFILE_CHANGED,

                    })
                ).rejects.toThrow(
                    "Only approved KYC can be re-verified"
                );

                expect(
                    repository
                        .resetForReverification
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "rejects when KYC does not exist",
            async () => {

                repository.findById
                    .mockResolvedValue(null);

                await expect(
                    service.trigger({

                        kycId:
                            "invalid",

                        userId:
                            "user-123",

                        trigger:
                            ReverificationTrigger
                                .DOCUMENT_EXPIRED,

                    })
                ).rejects.toThrow(
                    "KYC request not found"
                );
            }
        );

        it(
            "prevents cross-user reverification",
            async () => {

                repository.findById
                    .mockResolvedValue({

                        id:
                            "kyc-123",

                        userId:
                            "different-user",

                        status:
                            KycStatus.APPROVED,

                    });

                await expect(
                    service.trigger({

                        kycId:
                            "kyc-123",

                        userId:
                            "user-123",

                        trigger:
                            ReverificationTrigger
                                .DEVICE_CHANGED,

                    })
                ).rejects.toThrow(
                    "KYC does not belong to user"
                );

                expect(
                    repository
                        .resetForReverification
                ).not.toHaveBeenCalled();
            }
        );

    }
);
