import crypto from "crypto";
import {redis} from "../../../shared/config/redis";
import {RedisKeys} from "../../../shared/redis/redis.keys";
import {NotFoundError} from "../../../shared/errors/NotFoundError";
import {notificationService as defaultNotificationService} from "../../notification/service/notification.service";
import {userRepository as defaultUserRepository} from "../../auth/repositories/user.repository";
import {sessionRepository as defaultSessionRepository} from "../../auth/repositories/session.repository";
import {auditService as defaultAuditService} from "../../audit/services/audit.services";

const OTP_TTL = 10 * 60; // 10 minutes in seconds
const MAX_ATTEMPTS = 3; // Maximum number of attempts allowed
const LOCK_TTL = 15 * 60; // 15 minutes in seconds

export class TwoFactorService {
    constructor(
        private readonly userRepository = defaultUserRepository,
        private readonly notificationService = defaultNotificationService,
        private readonly sessionRepository = defaultSessionRepository,
        private readonly auditService = defaultAuditService,
    ) {}

    private generateOTP(): string {
        return crypto
        .randomInt(100000, 1000000)
        .toString();
    }

    async sendOTP(email: string) {
        const otp = this.generateOTP();
        const key = RedisKeys.otp(email);

        await redis.set(
            key,
            otp,
            "EX",
            OTP_TTL
        );

        await redis.del(
            RedisKeys.otpAttempts(email)
        );

        return otp;
    }

    async verifyOtp(
        email: string,
        inputOTP: string
    ) {
        const lockKey = RedisKeys.otpLock(email);

        const isLocked = await redis.exists(lockKey);

        if (isLocked) {
            throw new Error(
                "Too many failed attempts. Please try again later."
            );
        }

        const otpKey = RedisKeys.otp(email);

        const storedOTP = await redis.get(otpKey);

        if (!storedOTP) {
            throw new Error(
                "OTP has expired"
            );
        }

        if (storedOTP !== inputOTP) {
            const attemptsKey = 
             RedisKeys.otpAttempts(email);

            const attempts =
             await redis.incr(attemptsKey);        
             
             if (attempts === 1) {
                await redis.set(
                    lockKey,
                    "1",
                    "EX",
                    LOCK_TTL
                );

                await redis.del(otpKey);

                throw new Error(
                    "Too many OTP attempts. Please try again later."
                );
             }

             throw new Error(
                `Invalid OTP. You have ${MAX_ATTEMPTS - attempts} attempts left.`
             );
        }

        await redis.del(otpKey);
        await redis.del(
            RedisKeys.otpAttempts(email)
        );

        return true;
    }

    async verifyOTP(
        email: string,
        inputOTP: string
    ) {
        return this.verifyOtp(email, inputOTP);
    }

    async enable2FA(
        userId: string,
        method: "email" | "sms"
    ){
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError(
                "User not found"
            );
        }

        await this.userRepository.enable2FA(
            userId,
            method
        );

        const otp = await this.sendOTP(user.email);

        await this.notificationService.sendOTP({
            email: user.email,
            otp,
            method,
        });

        return {
            enabled: true,
            method,
        };
    }

    async verify2FA (
        userId: string,
        otp: string,
        sessionId: string
    ) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError(
                "User not found"
            );
        }

        await this.verifyOTP(
            user.email,
            otp
        );

        await this.sessionRepository.mark2FAVerified(
            sessionId
        );

        await this.auditService.log({
            userId,
            action: "2FA_VERIFIED",
            resource: "SESSION",
            entityId: sessionId,
        });

        return {
            twoFactorVerified: true,
        };
    }
}
