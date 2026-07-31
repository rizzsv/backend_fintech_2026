import { SpanStatusCode } from "@opentelemetry/api";

import { tracer } from "./tracer";

export async function withSpan<T>(

    name: string,

    callback: () => Promise<T>

): Promise<T> {

    const span =
        tracer.startSpan(name);

    try {

        const result =
            await callback();

        span.setStatus({

            code:
                SpanStatusCode.OK,

        });

        return result;

    } catch (error: any) {

        span.recordException(error);

        span.setStatus({

            code:
                SpanStatusCode.ERROR,

            message:
                error.message,

        });

        throw error;

    } finally {

        span.end();

    }

}