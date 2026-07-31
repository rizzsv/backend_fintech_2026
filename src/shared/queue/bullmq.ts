import IORedis from "ioredis";
import {
    Queue,
    Worker,
    QueueEvents,
    JobsOptions 
} from "bullmq";
import {env} from "../config/env";

export const redisConnection = 
new IORedis({
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

export function createQueue(
    name: string,
    defaultJobOptions?: JobsOptions,
) {
    return new Queue(name, {
        connection: redisConnection,
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
            connection: redisConnection,
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
        connection: redisConnection,
    })
}