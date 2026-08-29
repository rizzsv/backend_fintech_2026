import {
    describe,
    it,
    expect,
} from "vitest";

import {
    detectFileType,
} from "../../../src/modules/kyc/validators/file-signature.validator";

describe(
    "KYC upload security",
    () => {
        it(
            "accepts valid JPEG signature",
            () => {
                const buffer = Buffer.from([
                    0xff,
                    0xd8,
                    0xff,
                    0xe0,
                ]);

                expect(
                    detectFileType(buffer)
                ).toBe("jpeg");
            }
        );

        it(
            "accepts valid PNG signature",
            () => {
                const buffer = Buffer.from([
                    0x89,
                    0x50,
                    0x4e,
                    0x47,
                    0x0d,
                    0x0a,
                    0x1a,
                    0x0a,
                ]);

                expect(
                    detectFileType(buffer)
                ).toBe("png");
            }
        );

        it(
            "accepts valid PDF signature",
            () => {
                const buffer = Buffer.from("%PDF-1.7");

                expect(
                    detectFileType(buffer)
                ).toBe("pdf");
            }
        );

        it(
            "rejects fake image",
            () => {
                const buffer = Buffer.from("malicious content");

                expect(
                    detectFileType(buffer)
                ).toBeNull();
            }
        );

        it(
            "rejects empty file",
            () => {
                const buffer = Buffer.alloc(0);

                expect(
                    detectFileType(buffer)
                ).toBeNull();
            }
        );
    }
);
