import { VelocityContext, VelocityResult } from "../domain/fraud.types";
import { velocityRepository } from "../repositories/fraud.repository";
import { evaluateVelocity } from "../rules/velocity.rules";

export class VelocityService {
    async evaluate(
        context: VelocityContext
    ): Promise<VelocityResult> {
        const metrics = await velocityRepository.getMetrics(
            context.userId
        );

        const evaluation = evaluateVelocity({
            transactionCount1m : metrics.transactionCount1m,
            transactionCount1h : metrics.transactionCount1h,
            amount1h : metrics.amount1h.toNumber(),
            amount24h : metrics.amount24h.toNumber(),
        });
        return {
            allowed: evaluation.allowed,
            riskScore: evaluation.riskScore,
            reasons: evaluation.reasons,
            metrics: {
                transactionCount1m: metrics.transactionCount1m,
                transactionCount1h: metrics.transactionCount1h,
                amount1h: metrics.amount1h.toNumber(),
                amount24h: metrics.amount24h.toNumber(),
            }
        }
    }
}

export const velocityService = new VelocityService();