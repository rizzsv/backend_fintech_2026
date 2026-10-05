import { Request, Response } from "express";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { withdrawalExecutionService } from "../services/withdrawal.execution.service";
import { getQStashRetryInfo } from "../../../shared/queue/qstash.middleware";

/**
 * QStash HTTP endpoint for withdrawal processing
 * Called by QStash instead of BullMQ worker when QUEUE_PROVIDER=qstash
 */
export const withdrawalWorkerController = {
    async processWithdrawal(req: Request, res: Response): Promise<void> {
        try {
            const { withdrawalId } = req.body;

            if (!withdrawalId || typeof withdrawalId !== "string") {
                res.status(400).json({ error: "withdrawalId is required" });
                return;
            }

            const retryInfo = getQStashRetryInfo(req);

            BusinessLogger.info("QStash withdrawal worker triggered", {
                withdrawalId,
                retryCount: retryInfo.retryCount,
                retryTimestamps: retryInfo.retryTimestamps,
            });

            const result = await withdrawalExecutionService.executeWithdrawal(withdrawalId);

            BusinessLogger.info("QStash withdrawal worker completed", {
                withdrawalId,
                success: result.success,
                demo: result.demo,
            });

            res.status(200).json({
                success: true,
                result,
            });
        } catch (error) {
            BusinessLogger.error("QStash withdrawal worker failed", {
                withdrawalId: req.body?.withdrawalId,
                error: error instanceof Error ? error.message : String(error),
            });

            // Return 200 to prevent QStash retry for business logic errors
            // QStash should only retry on HTTP 5xx or network errors
            res.status(200).json({
                success: false,
                error: error instanceof Error ? error.message : "Withdrawal processing failed",
            });
        }
    },
};
