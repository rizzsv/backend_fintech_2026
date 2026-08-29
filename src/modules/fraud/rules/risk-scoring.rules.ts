import {
    FraudRiskLevel,
    RiskScoringContext,
    RiskScoringResult,
} from "../domain/fraud.types";

import {
    FRAUD_CONSTANTS,
} from "../domain/fraud.constants";


function clampScore(
    score: number
): number {

    return Math.min(
        Math.max(score, 0),
        FRAUD_CONSTANTS.RISK_SCORE.MAX
    );
}


function getRiskLevel(
    score: number
): FraudRiskLevel {

    if (
        score <=
        FRAUD_CONSTANTS.RISK_LEVEL.LOW_MAX
    ) {
        return "LOW";
    }


    if (
        score <=
        FRAUD_CONSTANTS.RISK_LEVEL.MEDIUM_MAX
    ) {
        return "MEDIUM";
    }


    if (
        score <=
        FRAUD_CONSTANTS.RISK_LEVEL.HIGH_MAX
    ) {
        return "HIGH";
    }


    return "CRITICAL";
}


export function calculateRiskScore(
    context: RiskScoringContext
): RiskScoringResult {

    let score = 0;

    const reasons: string[] = [];


    /**
     * VELOCITY
     */
    score += context.velocity.score ?? context.velocity.riskScore ?? 0;

    reasons.push(
        ...context.velocity.reasons
    );


    /**
     * ANOMALY
     */
    score += context.anomaly.score ?? context.anomaly.riskScore ?? 0;

    reasons.push(
        ...context.anomaly.reasons
    );


    /**
     * GEOLOCATION
     *
     * Optional karena belum kita implementasikan
     * di Sprint 8.4.
     */
    if (context.geolocation) {

        score +=
            context.geolocation.score;

        reasons.push(
            ...context.geolocation.reasons
        );
    }


    /**
     * DEVICE FINGERPRINTING
     *
     * Optional karena akan dikerjakan
     * pada Sprint 8.5.
     */
    if (context.device) {

        score +=
            context.device.score;

        reasons.push(
            ...context.device.reasons
        );
    }


    /**
     * SUSPICIOUS ACTIVITY
     *
     * Optional untuk Sprint 8.6.
     */
    if (context.suspiciousActivity) {

        score +=
            context.suspiciousActivity.score;

        reasons.push(
            ...context.suspiciousActivity.reasons
        );
    }


    /**
     * Jangan pernah membiarkan score
     * keluar dari 0 - 100.
     */
    score = clampScore(score);


    return {

        score,

        level:
            getRiskLevel(score),

        reasons,

    };
}