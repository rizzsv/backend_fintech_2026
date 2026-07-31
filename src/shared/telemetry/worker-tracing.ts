import {
    context,
    propagation,
} from "@opentelemetry/api";

export function injectTraceContext() {

    const carrier: Record<string, string> = {};

    propagation.inject(
        context.active(),
        carrier
    );

    return carrier;

}

export function extractTraceContext(
    carrier: Record<string, string>
) {

    return propagation.extract(
        context.active(),
        carrier
    );

}