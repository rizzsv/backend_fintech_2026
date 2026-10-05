import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";

import { logger } from "./shared/logger/logger";

import { paymentQueueHealthCheck } from "./shared/monitoring/queue.health";

import healthRoutes from "./routes/health.routes";
import metricsRoutes from "./routes/metrics.routes";
import v1Routes from "./routes/v1.routes";
import kycRoutes from "./modules/kyc/kyc.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.route";
import workersRoutes from "./routes/workers.routes";

import { globalRateLimiter } 
from "./shared/middleware/rateLimiter.middleware";

import { requestIdMiddleware } 
from "./shared/middleware/request-id.middleware";

import { traceMiddleware } 
from "./shared/middleware/trace.middleware";

import { errorHandler } 
from "./shared/middleware/errorHandler.middleware";

import { verifyQStashSignature } 
from "./shared/queue/qstash.middleware";

import { env } from "./shared/config/env";


const app = express();

// Production CORS: use FRONTEND_URL from env, fallback to localhost in development
const allowedOrigins = process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://172.22.63.252:3002",
    ];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key",
        "X-Requested-With",
    ],
};

app.use(
    requestIdMiddleware
);


app.use(

    pinoHttp({

        logger,

        autoLogging: {

            ignore(req) {

                return req.url === "/metrics" || req.path === "/api/v1/auth/verify-email";

            },

        },

    })

);


app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// QStash worker routes with raw body parser for signature verification
// MUST be registered BEFORE express.json() middleware
if (env.QUEUE_PROVIDER === 'qstash') {
    app.use(
        "/api/workers",
        express.text({ type: "application/json" }),
        verifyQStashSignature,
        workersRoutes
    );
}

app.use(
    express.json()
);


app.use(
    traceMiddleware
);


app.use(
    globalRateLimiter
);


// Bull Board disabled for Vercel serverless deployment
// Dynamic import prevents BullMQ dependency errors
if (process.env.ENABLE_BULL_BOARD === 'true') {
    import('./shared/monitoring/bull-board.js').then(({ setupBullBoard }) => {
        setupBullBoard(app);
    }).catch((err) => {
        logger.error('Failed to load Bull Board:', err);
    });
}


app.get(

    "/health/queue",

    async (req, res, next) => {

        try {

            const result =
                await paymentQueueHealthCheck();


            res.json({

                success: true,

                data: result,

            });


        } catch (error) {

            next(error);

        }

    }

);

app.use(
    "/health",
    healthRoutes
);


app.use(
    "/metrics",
    metricsRoutes
);

app.use(
    "/api/v1",
    dashboardRoutes
);


app.use(
    "/api/v1",
    v1Routes
);

app.use(
    "/api/v1/kyc",
    kycRoutes
);

app.use(
    errorHandler
);


export default app;