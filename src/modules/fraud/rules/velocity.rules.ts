import {
    FRAUD_CONSTANTS
} from '../domain/fraud.constants';

export interface VelocityMetrics {
    transactionCount1m: number;
    transactionCount1h: number;
    amount1h: number;
    amount24h: number;
}

export interface VelocityEvaluation {
    allowed: boolean;
    riskScore: number;
    reasons: string[];
}

export function evaluateVelocity(
    metrics: VelocityMetrics
): VelocityEvaluation {

    let riskScore = 0;

    const reasons: string[] = [];

    if (
        metrics.transactionCount1m >= 
        FRAUD_CONSTANTS.VELOCITY.MAX_TRANSACTIONS_PER_MINUTE 
    ) {
        riskScore += FRAUD_CONSTANTS.RISK_SCORE.VELOCITY_1M;

        reasons.push(
            "EXCESSIVE_TRANSACTIONS_1M"
        )
    }

    if (
        metrics.amount1h >= 
        FRAUD_CONSTANTS.VELOCITY.MAX_AMOUNT_PER_HOUR
    ) {
        riskScore += FRAUD_CONSTANTS.RISK_SCORE.AMOUNT_1H;

        reasons.push(
            "EXCESSIVE_AMOUNT_1H"
        )
    }

    if (
        metrics.amount24h >= 
        FRAUD_CONSTANTS.VELOCITY.MAX_AMOUNT_PER_DAY
    ) {
        riskScore += FRAUD_CONSTANTS.RISK_SCORE.AMOUNT_24H;

        reasons.push(
            "EXCESSIVE_AMOUNT_24H"
        )
    }

    return {
        allowed: riskScore < 70,
        riskScore,
        reasons
    }
}