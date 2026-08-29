import {
    describe,
    it,
    expect,
} from "vitest";

import {
    KycUploadValidator,
} from "../../../src/modules/kyc/validators/kyc-upload.validator";

describe(
    "KycUploadValidator",
    () => {

        const validator =
            new KycUploadValidator();

        it(
            "should accept valid JPEG document",
            () => {

                const file = {
                    originalname: "ktp.jpg",
                    mimetype: "image/jpeg",
                    size: 1024,
                    buffer: Buffer.from([
                        0xff,
                        0xd8,
                        0xff,
                        0xe0,
                    ]),
                } as Express.Multer.File;

                expect(() =>
                    validator.validateDocument(file)
                ).not.toThrow();
            }
        );

        it(
            "should reject unsupported MIME type",
            () => {

                const file = {
                    originalname: "ktp.exe",
                    mimetype: "application/octet-stream",
                    size: 1024,
                    buffer: Buffer.from("malware"),
                } as Express.Multer.File;

                expect(() =>
                    validator.validateDocument(file)
                ).toThrow("Unsupported file type");
            }
        );

        it(
            "should reject invalid extension",
            () => {

                const file = {
                    originalname: "ktp.exe",
                    mimetype: "image/jpeg",
                    size: 1024,
                    buffer: Buffer.from([
                        0xff,
                        0xd8,
                        0xff,
                    ]),
                } as Express.Multer.File;

                expect(() =>
                    validator.validateDocument(file)
                ).toThrow("Unsupported file extension");
            }
        );

        it(
            "should reject fake JPEG",
            () => {

                const file = {
                    originalname: "ktp.jpg",
                    mimetype: "image/jpeg",
                    size: 1024,
                    buffer: Buffer.from("this is not jpeg"),
                } as Express.Multer.File;

                expect(() =>
                    validator.validateDocument(file)
                ).toThrow("Unable to verify file type");
            }
        );

        it(
            "should reject path traversal filename",
            () => {

                const file = {
                    originalname: "../ktp.jpg",
                    mimetype: "image/jpeg",
                    size: 1024,
                    buffer: Buffer.from([
                        0xff,
                        0xd8,
                        0xff,
                    ]),
                } as Express.Multer.File;

                expect(() =>
                    validator.validateDocument(file)
                ).toThrow("Invalid file name");
            }
        );

        it(
            "should reject file larger than 5 MB",
            () => {

                const file = {
                    originalname: "ktp.jpg",
                    mimetype: "image/jpeg",
                    size: 6 * 1024 * 1024,
                    buffer: Buffer.from([
                        0xff,
                        0xd8,
                        0xff,
                    ]),
                } as Express.Multer.File;

                expect(() =>
                    validator.validateDocument(file)
                ).toThrow("File exceeds maximum allowed size");
            }
        );

        it(
            "should require document",
            () => {

                expect(() =>
                    validator.validateDocument(undefined)
                ).toThrow("KYC document is required");
            }
        );
    }
);