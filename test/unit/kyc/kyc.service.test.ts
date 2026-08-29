import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from "vitest";

import {
    KycService,
} from "../../../src/modules/kyc/services/kyc.service";

import {
    KycStatus,
} from "@prisma/client";

describe(
    "KycService",
    () => {
        const repository = {
            findByUserId: vi.fn(),
            create: vi.fn(),
        } as any;

        const storage = {
            uploadDocument: vi.fn(),
            uploadSelfie: vi.fn(),
            delete: vi.fn(),
        } as any;

        const validator = {
            validateDocument: vi.fn(),
            validateSelfie: vi.fn(),
        } as any;

        const service =
            new KycService(
                repository,
                storage,
                validator
            );

        const document = {
            originalname: "ktp.jpg",
            mimetype: "image/jpeg",
            size: 1024,
            buffer: Buffer.from([
                0xff,
                0xd8,
                0xff,
            ]),
        } as Express.Multer.File;

        const selfie = {
            originalname: "selfie.jpg",
            mimetype: "image/jpeg",
            size: 1024,
            buffer: Buffer.from([
                0xff,
                0xd8,
                0xff,
            ]),
        } as Express.Multer.File;

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            "should create KYC request",
            async () => {
                repository.findByUserId
                    .mockResolvedValue(null);

                storage.uploadDocument
                    .mockResolvedValue(
                        "user-123/documents/ktp.jpg"
                    );

                storage.uploadSelfie
                    .mockResolvedValue(
                        "user-123/selfies/selfie.jpg"
                    );

                repository.create
                    .mockResolvedValue({
                        id: "kyc-123",
                        userId: "user-123",
                        documentPath:
                            "user-123/documents/ktp.jpg",
                        selfiePath:
                            "user-123/selfies/selfie.jpg",
                        status: KycStatus.PENDING,
                        reviewNote: null,
                        reviewedAt: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                const result =
                    await service.uploadDocuments({
                        userId: "user-123",
                        document,
                        selfie,
                    });

                expect(repository.create)
                    .toHaveBeenCalled();

                expect(result.status)
                    .toBe(KycStatus.PENDING);
            }
        );

        it(
            "should reject existing pending KYC",
            async () => {
                repository.findByUserId
                    .mockResolvedValue({
                        id: "kyc-existing",
                        status: KycStatus.PENDING,
                    });

                await expect(
                    service.uploadDocuments({
                        userId: "user-123",
                        document,
                        selfie,
                    })
                ).rejects.toThrow(
                    "KYC request is already pending"
                );

                expect(storage.uploadDocument)
                    .not.toHaveBeenCalled();
            }
        );

        it(
            "should reject existing verified KYC",
            async () => {
                repository.findByUserId
                    .mockResolvedValue({
                        id: "kyc-existing",
                        status: KycStatus.VERIFIED,
                    });

                await expect(
                    service.uploadDocuments({
                        userId: "user-123",
                        document,
                        selfie,
                    })
                ).rejects.toThrow(
                    "KYC has already been verified"
                );

                expect(storage.uploadDocument)
                    .not.toHaveBeenCalled();
            }
        );

        it(
            "should cleanup document if selfie upload fails",
            async () => {
                repository.findByUserId
                    .mockResolvedValue(null);

                storage.uploadDocument
                    .mockResolvedValue(
                        "user-123/documents/ktp.jpg"
                    );

                storage.uploadSelfie
                    .mockRejectedValue(
                        new Error("Selfie upload failed")
                    );

                await expect(
                    service.uploadDocuments({
                        userId: "user-123",
                        document,
                        selfie,
                    })
                ).rejects.toThrow(
                    "Selfie upload failed"
                );

                expect(storage.delete)
                    .toHaveBeenCalledWith(
                        "user-123/documents/ktp.jpg"
                    );
            }
        );
    }
);