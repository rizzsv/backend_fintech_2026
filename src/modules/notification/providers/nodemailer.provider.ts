import nodemailer from "nodemailer";
import { logger } from "../../../shared/logger/logger";


export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((err) => {
    if (err) {
        logger.error("SMTP Error:");
    } else {
        logger.info("SMTP Connected");
    }
});
