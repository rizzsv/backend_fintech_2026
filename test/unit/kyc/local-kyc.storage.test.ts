import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from "vitest";

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
    LocalKycStorage,
} from "../../../src/modules/kyc/storage/local-kyc.storage";

describe(
    "LocalKycStorage",
    () => {

        let storagePath: string;
        let storage: LocalKycStorage;

        beforeEach(
            async () => {

                storagePath =
                    await fs.mkdtemp(
                        path.join(
                            os.tmpdir(),
                            "kyc-storage-"
                        )
                    );

                process.env.KYC_STORAGE_PATH =
                    storagePath;

                storage =
                    new LocalKycStorage();
            }
        );

        afterEach(
            async () => {

                await fs.rm(
                    storagePath,
                    {
                        recursive: true,
                        force: true,
                    }
                );

                delete process.env.KYC_STORAGE_PATH;
            }
        );

        it(
            "should upload document",
            async () => {

                const file = {
                    originalname: "ktp.jpg",
                    mimetype: "image/jpeg",
                    buffer: Buffer.from("fake-ktp"),
                    size: 8,
                } as Express.Multer.File;

                const result =
                    await storage.uploadDocument(
                        file,
                        "user-123"
                    );

                expect(result)
                    .toContain("user-123");

                const fullPath =
                    path.join(
                        storagePath,
                        result
                    );

                const exists =
                    await fs
                        .access(fullPath)
                        .then(() => true)
                        .catch(() => false);

                expect(exists)
                    .toBe(true);
            }
        );

        it(
            "should upload selfie",
            async () => {

                const file = {
                    originalname: "selfie.png",
                    mimetype: "image/png",
                    buffer: Buffer.from("fake-selfie"),
                    size: 11,
                } as Express.Multer.File;

                const result =
                    await storage.uploadSelfie(
                        file,
                        "user-123"
                    );

                expect(result)
                    .toContain("user-123");

                expect(result)
                    .toContain("selfies");
            }
        );

        it(
            "should delete stored file",
            async () => {

                const file = {
                    originalname: "ktp.jpg",
                    mimetype: "image/jpeg",
                    buffer: Buffer.from("fake-ktp"),
                    size: 8,
                } as Express.Multer.File;

                const result =
                    await storage.uploadDocument(
                        file,
                        "user-123"
                    );

                const fullPath =
                    path.join(
                        storagePath,
                        result
                    );

                await storage.delete(result);

                const exists =
                    await fs
                        .access(fullPath)
                        .then(() => true)
                        .catch(() => false);

                expect(exists)
                    .toBe(false);
            }
        );
    }
);