import {Queue} from "bullmq";
import {redis} from "../../../shared/config/redis";

export const transferReversalQueue = new Queue(
    "transfer-reversal",
    {
        connection: redis,
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: "exponential",
                delay: 3000
            }
        }
    }
)