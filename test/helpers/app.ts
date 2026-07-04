import express from "express";

import authRouter from "../../src/modules/auth/auth.routes";
import walletRouter from "../../src/modules/wallet/wallet.routes";
import { errorHandler } from "../../src/shared/middleware/errorHandler.middleware";

const app = express();

app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/wallet", walletRouter);

app.use(errorHandler);

export default app;