import { Client } from "@upstash/qstash";
import { env } from "../config/env";
import { BusinessLogger } from "../logger/business-logger";

/**
 * QStash client singleton
 * Only initialized when QUEUE_PROVIDER=qstash
 */
let qstashClient: Client | null = null;

export function getQStashClient(): Client {
    if (env.QUEUE_PROVIDER !== 'qstash') {
        throw new Error('QStash client requested but QUEUE_PROVIDER is not qstash');
    }

    if (!env.QSTASH_URL || !env.QSTASH_TOKEN) {
        throw new Error('QSTASH_URL and QSTASH_TOKEN must be set when QUEUE_PROVIDER=qstash');
    }

    if (!qstashClient) {
        qstashClient = new Client({
            baseUrl: env.QSTASH_URL,
            token: env.QSTASH_TOKEN,
        });

        BusinessLogger.info('QStash client initialized', {
            baseUrl: env.QSTASH_URL,
        });
    }

    return qstashClient;
}

/**
 * Publish message to QStash with retry configuration
 */
export async function publishToQStash(params: {
    url: string;
    body: Record<string, any>;
    retries?: number;
    delay?: number;
    deduplicationId?: string;
}): Promise<void> {
    const client = getQStashClient();

    const options: any = {
        retries: params.retries ?? 5,
    };

    if (params.delay) {
        options.delay = params.delay;
    }

    if (params.deduplicationId) {
        options.deduplicationId = params.deduplicationId;
    }

    await client.publishJSON({
        url: params.url,
        body: params.body,
        ...options,
    });

    BusinessLogger.info('Message published to QStash', {
        url: params.url,
        retries: options.retries,
        delay: params.delay,
        deduplicationId: params.deduplicationId,
    });
}
