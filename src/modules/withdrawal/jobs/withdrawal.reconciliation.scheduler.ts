import cron, {ScheduledTask} from 'node-cron';
import { withdrawalReconciliationService } from '../reconciliation/withdrawal.reconciliation.service';
import { BusinessLogger } from '../../../shared/logger/business-logger';
export class WithdrawalReconciliationScheduler {
    private task?: ScheduledTask;


    start() {
        this.task = cron.schedule(
            "*/5 * * * *",
            async()=> {
                try {
                    await withdrawalReconciliationService.reconcile();
                } catch (error) {
                    BusinessLogger.error(
                        "Withdrawal scheduler failed",
                        {
                            error
                        }
                    );
                }
            }
        );

        BusinessLogger.info(
            "Withdrawal reconciliation scheduler started"
        );
    }

    stop() {
        this.task?.stop();
    }
}

export const withdrawalReconciliationScheduler = new WithdrawalReconciliationScheduler();