import pino from "pino";

export const logger = pino({
    level: process.env.LOG_LEVEL || "info",

    timestamp: pino.stdTimeFunctions.isoTime,

    /**
     * pino-http serialises the whole request, which puts the bearer token in
     * every access log line. Credentials must not be readable from the log
     * stream, so they are censored before anything is written.
     */
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            'res.headers["set-cookie"]',
            "password",
            "passwordHash",
            "accessToken",
            "refreshToken",
            "token",
            "*.password",
            "*.passwordHash",
            "*.accessToken",
            "*.refreshToken",
            "*.token",
        ],
        censor: "[REDACTED]",
    },

    formatters: {
        level(label) {
            return {
                level: label,
            };
        },
    },
});
