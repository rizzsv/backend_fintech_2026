import { Router } from "express";
import { otpController } from "./controllers/otp.controller";


const router = Router();

router.post(
  "/send",
  authenticate,
  requestValidator(sendOtpSchema),
  otpController.generate
);

router.post(
  "/verify",
  authenticate,
  requestValidator(verifyOtpSchema),
  otpController.verify
);

export default router;