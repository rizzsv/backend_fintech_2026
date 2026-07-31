import express from "express";
import pinoHttp from "pino-http";

import { logger } from "./shared/logger/logger";

import { setupBullBoard } from "./shared/monitoring/bull-board";
import { paymentQueueHealthCheck } from "./shared/monitoring/queue.health";

import healthRoutes from "./routes/health.routes";
import metricsRoutes from "./routes/metrics.routes";
import v1Routes from "./routes/v1.routes";

import { globalRateLimiter } 
from "./shared/middleware/rateLimiter.middleware";

import { requestIdMiddleware } 
from "./shared/middleware/request-id.middleware";

import { traceMiddleware } 
from "./shared/middleware/trace.middleware";

import { errorHandler } 
from "./shared/middleware/errorHandler.middleware";


const app = express();


app.use(
    requestIdMiddleware
);


app.use(

    pinoHttp({

        logger,

        autoLogging: {

            ignore(req) {

                return req.url === "/metrics";

            },

        },

    })

);


app.use(
    express.json()
);


app.use(
    traceMiddleware
);


app.use(
    globalRateLimiter
);


setupBullBoard(app);


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
    v1Routes
);


app.use(
    errorHandler
);


export default app;