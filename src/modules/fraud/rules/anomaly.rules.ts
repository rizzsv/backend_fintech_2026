import {
    AnomalyContext,
    AnomalyResult,
} from "../domain/fraud.types";

import {
    FRAUD_CONSTANTS,
} from "../domain/fraud.constants";


export function evaluateAnomaly(
    context: AnomalyContext
): AnomalyResult {

    let riskScore = 0;

    const reasons: string[] = [];


    /**
     * RULE 1
     *
     * Current transaction amount jauh lebih besar
     * dibanding rata-rata transaksi user.
     *
     * Contoh:
     *
     * averageAmount = 100.000
     * currentAmount = 600.000
     *
     * 600.000 > 100.000 * 5
     *
     * => anomaly
     */
    if (
        context.averageAmount > 0 &&
        context.amount >=
            context.averageAmount *
            FRAUD_CONSTANTS.ANOMALY
                .AMOUNT_MULTIPLIER
    ) {

        riskScore +=
            FRAUD_CONSTANTS.ANOMALY
                .AMOUNT_RISK_SCORE;

        reasons.push(
            "TRANSACTION_AMOUNT_ANOMALY"
        );
    }


    /**
     * RULE 2
     *
     * Transaction frequency user jauh lebih tinggi
     * dibanding kebiasaan normalnya.
     *
     * Contoh:
     *
     * average = 3 transaksi / hari
     * current  = 10 transaksi / hari
     *
     * 10 > 3 * 3
     *
     * => anomaly
     */
    if (
        context.averageTransactionCount24h > 0 &&
        context.transactionCount24h >=
            context.averageTransactionCount24h *
            FRAUD_CONSTANTS.ANOMALY
                .TRANSACTION_COUNT_MULTIPLIER
    ) {

        riskScore +=
            FRAUD_CONSTANTS.ANOMALY
                .FREQUENCY_RISK_SCORE;

        reasons.push(
            "TRANSACTION_FREQUENCY_ANOMALY"
        );
    }


    /**
     * RULE 3
     *
     * Absolute amount terlalu besar.
     *
     * Ini berbeda dengan RULE 1.
     *
     * Rule 1:
     * dibandingkan dengan behavior user.
     *
     * Rule 3:
     * absolute threshold.
     */
    if (
        context.amount >=
        FRAUD_CONSTANTS.ANOMALY
            .LARGE_AMOUNT_TRESHOLD
    ) {

        riskScore +=
            FRAUD_CONSTANTS.ANOMALY
                .LARGE_AMOUNT_RISK_SCORE;

        reasons.push(
            "LARGE_TRANSACTION_AMOUNT"
        );
    }


    return {
        detected:
            riskScore > 0,

        riskScore,

        reasons,
    };
}