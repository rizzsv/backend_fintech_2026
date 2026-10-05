import { Worker } from "bullmq";
import { redisConnection } from "../../../shared/queue/bullmq";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { withdrawalExecutionService } from "../services/withdrawal.execution.service";

/**
 * BullMQ worker adapter for withdrawal processing
 * Thin wrapper around withdrawalExecutionService
 */
export const withdrawalWorker = new Worker(
    "withdrawal",
    async (job) => {
        const { withdrawalId } = job.data;

        BusinessLogger.info("Withdrawal worker started", {
            withdrawalId,
            jobId: job.id,
        });

        try {
            const result = await withdrawalExecutionService.executeWithdrawal(withdrawalId);

            BusinessLogger.info("Withdrawal worker completed", {
                withdrawalId,
                success: result.success,
                demo: result.demo,
            });

            return result;
        } catch (error) {
            BusinessLogger.error("Withdrawal worker failed", {
                withdrawalId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 5,
        removeOnComplete: {
            count: 100,
        },
        removeOnFail: {
            count: 1000,
        },
    }
);

withdrawalWorker.on("completed", (job) => {
    BusinessLogger.info("Withdrawal job completed", {
        jobId: job.id,
        withdrawalId: job.data.withdrawalId,
    });
});

withdrawalWorker.on("failed", (job, err) => {
    BusinessLogger.error("Withdrawal job failed", {
        jobId: job?.id,
        withdrawalId: job?.data?.withdrawalId,
        error: err.message,
    });
});

withdrawalWorker.on("error", (err) => {
    BusinessLogger.error("Withdrawal worker error", {
        error: err.message,
    });
});
