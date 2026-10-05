import IORedis from "ioredis";
import {
    Queue,
    Worker,
    QueueEvents,
    JobsOptions 
} from "bullmq";
import {env} from "../config/env";

/**
 * BullMQ Redis connection - only used when QUEUE_PROVIDER=bullmq
 * When QUEUE_PROVIDER=qstash, these functions throw to prevent accidental use
 * 
 * For local development with BullMQ, set these env vars:
 * - QUEUE_PROVIDER=bullmq
 * - REDIS_URL=redis://... (or individual REDIS_HOST/PORT/PASSWORD)
 */

let _redisConnection: IORedis | null = null;

function getRedisConnection(): IORedis {
    if (env.QUEUE_PROVIDER === 'qstash') {
        throw new Error(
            'BullMQ Redis connection not available when QUEUE_PROVIDER=qstash. ' +
            'Use QStash provider instead.'
        );
    }

    if (!_redisConnection) {
        // For local dev, support REDIS_URL or fall back to localhost
        const redisUrl = process.env.REDIS_URL;
        
        if (redisUrl) {
            _redisConnection = new IORedis(redisUrl, {
                maxRetriesPerRequest: null,
                enableReadyCheck: false
            });
        } else {
            // Local development fallback
            _redisConnection = new IORedis({
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT || 6379),
                password: process.env.REDIS_PASSWORD || undefined,
                maxRetriesPerRequest: null,
                enableReadyCheck: false
            });
        }
    }

    return _redisConnection;
}

// Lazy getter for backwards compatibility
export const redisConnection = new Proxy({} as IORedis, {
    get(_, prop) {
        const conn = getRedisConnection();
        const value = (conn as any)[prop];
        return typeof value === 'function' ? value.bind(conn) : value;
    }
});

export function createQueue(
    name: string,
    defaultJobOptions?: JobsOptions,
) {
    return new Queue(name, {
        connection: getRedisConnection(),
        defaultJobOptions
    });
}

export function createWorker(
    name: string,
    processor: any,
) { 
    return new Worker(
        name,
        processor,
        {
            connection: getRedisConnection(),
            concurrency: 10,
            metrics: {
                maxDataPoints: 1000,
            }
        }
  );
}

export function createQueueEvents(
    name: string,
) {
    return new QueueEvents(name, {
        connection: getRedisConnection(),
    })
}
