import {
    SuspiciousActivityContext,
    suspiciousActivityResult,
} from "../domain/fraud.types";

import {
    FRAUD_CONSTANTS,
} from "../domain/fraud.constants";


export function evaluateSuspiciousActivity(
    context: SuspiciousActivityContext
): suspiciousActivityResult {

    let riskScore = 0;

    const reasons: string[] = [];


    /**
     * RULE 1
     *
     * Terlalu banyak transaksi
     * dalam 1 menit.
     */
    if (
        context.transactionCount1m >=
        FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
            .TRANSACTION_COUNT_1M_THRESHOLD
    ) {

        riskScore +=
            FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
                .VELOCITY_RISK_SCORE;

        reasons.push(
            "HIGH_TRANSACTION_FREQUENCY_1M"
        );
    }


    /**
     * RULE 2
     *
     * Terlalu banyak transaksi
     * dalam 1 jam.
     */
    if (
        context.transactionCount1h >=
        FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
            .TRANSACTION_COUNT_1H_THRESHOLD
    ) {

        riskScore +=
            FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
                .HIGH_VELOCITY_RISK_SCORE;

        reasons.push(
            "HIGH_TRANSACTION_FREQUENCY_1H"
        );
    }


    /**
     * RULE 3
     *
     * Banyak transaksi gagal.
     *
     * Bisa mengindikasikan:
     *
     * - credential abuse
     * - brute force
     * - automated activity
     * - account takeover
     */
    if (
        context.failedTransactionCount1h >=
        FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
            .FAILED_TRANSACTION_1H_THRESHOLD
    ) {

        riskScore +=
            FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
                .FAILED_TRANSACTION_RISK_SCORE;

        reasons.push(
            "HIGH_FAILED_TRANSACTION_RATE"
        );
    }


    /**
     * RULE 4
     *
     * Amount spike.
     *
     * Contoh:
     *
     * average = 100.000
     * current = 1.000.000
     *
     * current / average = 10x
     */
    if (
        context.averageTransactionAmount24h > 0 &&
        context.currentAmount >=
        context.averageTransactionAmount24h *
        FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
            .AMOUNT_SPIKE_MULTIPLIER
    ) {

        riskScore +=
            FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
                .AMOUNT_SPIKE_RISK_SCORE;

        reasons.push(
            "TRANSACTION_AMOUNT_SPIKE"
        );
    }


    /**
     * RULE 5
     *
     * Dormant account suddenly aktif.
     *
     * Contoh:
     *
     * user tidak melakukan transaksi
     * selama 72 jam.
     *
     * Kemudian tiba-tiba melakukan
     * transaksi besar.
     */
    if (
        context.lastActivityAt &&
        context.currentActivityAt
    ) {

        const inactiveMs =
            context.currentActivityAt.getTime() -
            context.lastActivityAt.getTime();


        const inactiveHours =
            inactiveMs /
            (1000 * 60 * 60);


        if (
            inactiveHours >=
            FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
                .INACTIVE_PERIOD_HOURS
        ) {

            riskScore +=
                FRAUD_CONSTANTS.SUSPICIOUS_ACTIVITY
                    .DORMANT_ACCOUNT_RISK_SCORE;

            reasons.push(
                "DORMANT_ACCOUNT_ACTIVITY"
            );
        }
    }


    return {

        suspicious:
            riskScore > 0,

        riskScore,

        reasons,

    };
}