import { Router } from "express";
import { withdrawalController } from "./controllers/withdrawal.controller";


const router = Router();

router.post(
    "/",
    withdrawalController.create
);

export default router;