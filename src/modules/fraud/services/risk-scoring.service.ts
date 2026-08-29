import { RiskScoringContext, RiskScoringResult } from "../domain/fraud.types";
import { calculateRiskScore } from "../rules/risk-scoring.rules";

export class RiskScoringService {
    calculate(
        context: RiskScoringContext
    ): RiskScoringResult {
        return calculateRiskScore(
            context
        )
    }
}

export const riskScoringService = new RiskScoringService();