import { Request, Response } from "express";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { withdrawalReconciliationService } from "../reconciliation/withdrawal.reconciliation.service";
import { getQStashRetryInfo } from "../../../shared/queue/qstash.middleware";

/**
 * QStash HTTP endpoint for withdrawal reconciliation job
 * Called periodically by QStash schedule (replaces node-cron scheduler)
 */
export const reconciliationWorkerController = async (req: Request, res: Response) => {
    try {
        const retryInfo = getQStashRetryInfo(req);

        BusinessLogger.info("QStash reconciliation job triggered", {
            retryCount: retryInfo.retryCount,
            retryTimestamps: retryInfo.retryTimestamps,
        });

        // Execute reconciliation
        await withdrawalReconciliationService.reconcile();

        BusinessLogger.info("Reconciliation job completed successfully");

        res.status(200).json({
            success: true,
            message: "Reconciliation completed",
        });
    } catch (error) {
        BusinessLogger.error("Reconciliation job failed", { error });

        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
