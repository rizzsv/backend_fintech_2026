import {
    describe,
    it,
    expect,
} from "vitest";

import {
    evaluateDeviceFingerprint,
} from "../../../src/modules/fraud/rules/device.rules";

describe(
    "Device Fingerprint Rules",
    () => {

        it(
            "should detect new device",
            () => {

                const result =
                    evaluateDeviceFingerprint({

                        userId: "user-1",

                        deviceId: "device-1",

                        fingerprint: "fp-1",

                        isKnownDevice: false,

                        deviceTransactionCount24h: 2,

                        userDeviceCount: 1,

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.riskScore
                ).toBe(15);

                expect(
                    result.reasons
                ).toContain(
                    "NEW_DEVICE"
                );
            }
        );

        it(
            "should detect high device activity",
            () => {

                const result =
                    evaluateDeviceFingerprint({

                        userId: "user-1",

                        deviceId: "device-1",

                        fingerprint: "fp-1",

                        isKnownDevice: true,

                        deviceTransactionCount24h: 150,

                        userDeviceCount: 1,

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "HIGH_DEVICE_TRANSACTION_ACTIVITY"
                );
            }
        );

        it(
            "should detect too many devices",
            () => {

                const result =
                    evaluateDeviceFingerprint({

                        userId: "user-1",

                        deviceId: "device-6",

                        fingerprint: "fp-6",

                        isKnownDevice: true,

                        deviceTransactionCount24h: 2,

                        userDeviceCount: 6,

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "TOO_MANY_USER_DEVICES"
                );
            }
        );

        it(
            "should allow normal known device",
            () => {

                const result =
                    evaluateDeviceFingerprint({

                        userId: "user-1",

                        deviceId: "device-1",

                        fingerprint: "fp-1",

                        isKnownDevice: true,

                        deviceTransactionCount24h: 5,

                        userDeviceCount: 2,

                    });

                expect(
                    result.suspicious
                ).toBe(false);

                expect(
                    result.riskScore
                ).toBe(0);

                expect(
                    result.reasons
                ).toHaveLength(0);
            }
        );

    }
);