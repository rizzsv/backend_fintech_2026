import {
    DeviceFingerprintContext,
    DeviceFingerprintResult,
} from "../domain/fraud.types";

import {
    FRAUD_CONSTANTS,
} from "../domain/fraud.constants";


export function evaluateDeviceFingerprint(
    context: DeviceFingerprintContext
): DeviceFingerprintResult {

    let riskScore = 0;

    const reasons: string[] = [];


    /**
     * RULE 1
     *
     * Device belum pernah digunakan oleh user.
     */
    if (!context.isKnownDevice) {

        riskScore +=
            FRAUD_CONSTANTS.DEVICE.NEW_DEVICE_RISK_SCORE;

        reasons.push(
            "NEW_DEVICE"
        );
    }


    /**
     * RULE 2
     *
     * Satu device melakukan terlalu banyak
     * transaksi dalam 24 jam.
     *
     * Bisa mengindikasikan:
     *
     * - automation
     * - credential sharing
     * - account abuse
     */
    if (
        context.deviceTransactionCount24h >=
        FRAUD_CONSTANTS.DEVICE
            .MAX_DEVICE_TRANSACTIONS_24H
    ) {

        riskScore +=
            FRAUD_CONSTANTS.DEVICE
                .HIGH_DEVICE_ACTIVITY_RISK_SCORE;

        reasons.push(
            "HIGH_DEVICE_TRANSACTION_ACTIVITY"
        );
    }


    /**
     * RULE 3
     *
     * User memiliki terlalu banyak device.
     */
    if (
        context.userDeviceCount >=
        FRAUD_CONSTANTS.DEVICE
            .MAX_DEVICES_PER_USER
    ) {

        riskScore +=
            FRAUD_CONSTANTS.DEVICE
                .TOO_MANY_DEVICES_RISK_SCORE;

        reasons.push(
            "TOO_MANY_USER_DEVICES"
        );
    }


    return {

        suspicious:
            riskScore > 0,

        riskScore,

        reasons,

    };
}