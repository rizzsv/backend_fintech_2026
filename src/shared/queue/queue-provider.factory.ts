import { IQueueProvider } from "./queue-provider.interface";
import { bullmqProvider } from "./bullmq-provider";
import { qstashProvider } from "./qstash-provider";
import { env } from "../config/env";

/**
 * Factory for queue provider selection
 * Controlled by QUEUE_PROVIDER env var: 'bullmq' (default) | 'qstash'
 */
export function getQueueProvider(): IQueueProvider {
    const provider = env.QUEUE_PROVIDER || 'bullmq';

    switch (provider) {
        case 'bullmq':
            return bullmqProvider;
        case 'qstash':
            return qstashProvider;
        default:
            throw new Error(`Unknown queue provider: ${provider}`);
    }
}

export const queueProvider = getQueueProvider();
