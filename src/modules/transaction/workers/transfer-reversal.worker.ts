import {Worker} from "bullmq";
import { redis } from "../../../shared/config/redis";
import { reversalService } from "../services/reversal.service";

new Worker(
    "transfer-reversal",
    async job => {
        await reversalService.reverse(
            job.data.transactionId
        );
    },
    {
        connection: redis,
    }
)