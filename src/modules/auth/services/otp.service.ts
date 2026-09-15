import crypto from 'crypto';
import { NotificationChannel, OtpPurpose } from '@prisma/client'
import { otpRepository, OtpRepository } from '../repositories/otp.repository';
import { GenerateOtpInput, GenerateOtpResult, VerifOtpInput, VerifyOtpResult } from '../types/otp.types';
import { notificationService } from '../../notification/service/notification.service';
import { NotificationType } from '../../notification/types/notification.types';

interface OtpDeliveryService {
    sendOtp(
        input: {
            userId: string;
            otp: string;
            purpose: OtpPurpose;
            expiresAt: Date;
        }
    ): Promise<void>;
}

const otpDeliveryService: OtpDeliveryService = {
    async sendOtp(input) {
        await notificationService.createNotification({
            userId: input.userId,
            type: NotificationType.OTP,
            channel: NotificationChannel.IN_APP,
            title: "Your verification code",
            message: `Your OTP is ${input.otp}. It expires in 5 minutes.`,
            resource: "OTP",
            entityId: input.purpose,
        });
    },
};

export class OtpService {
    private readonly OTP_LENGTH = 6;

    private readonly OTP_EXPIRATION_MINUTES = 5 * 60 * 1000;

    private readonly MAX_ATTEMPTS = 5;

    constructor(
        private readonly otpRepository: OtpRepository,
        private readonly otpDeliveryService: OtpDeliveryService
    ){}

    private generateOtp(): string {
        const min = 10 ** (this.OTP_LENGTH - 1);
        const max = 10 ** this.OTP_LENGTH;
        return crypto.randomInt(min, max).toString();
    }

    private hashOtp(
        otp: string
    ): string {
        return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
    }

    async generate(
        input: GenerateOtpInput
    ): Promise<GenerateOtpResult> {
        if (!input.userId) {
            throw new Error(
                "User ID is required"
            );
        }

        if (!input.purpose) {
            throw new Error(
                "OTP purpose is required"
            );
        }

        await this.otpRepository.invalidateActive(
            input.userId,
            input.purpose
        )

        const otp = this.generateOtp();

        const otpHash = this.hashOtp(otp);

        const expiresAt = new Date(
            Date.now() + this.OTP_EXPIRATION_MINUTES
        );

        await this.otpRepository.create({
            user: {
                connect: {
                    id: input.userId,
                },
            },
            otpHash,
            purpose: input.purpose,
            expiresAt,
        });

        await this.otpDeliveryService.sendOtp({
            userId: input.userId,
            otp,
            purpose: input.purpose,
            expiresAt
        });

        return {
            expiresAt,
            purpose: input.purpose
        }
    }

    async verify (
        input: VerifOtpInput
    ): Promise<VerifyOtpResult> {
        if (!input.userId) {
            throw new Error(
                "User ID is required"
            );
        }

        if (!input.purpose) {
            throw new Error(
                "OTP purpose is required"
            )
        }

        if (!input.otp) {
            throw new Error(
                "OTP is required"
            )
        }

        if (
            !/^\d{6}$/.test(
                input.otp
            )
        ) {

            return {

                verified: false,

                purpose:
                    input.purpose,

                reason:
                    "OTP must contain exactly 6 digits",

            };
        }

        const otp = await this.otpRepository.findActive(
            input.userId,
            input.purpose
        )

        if (!otp) {
            return {
                verified: false,
                purpose: input.purpose,
                reason: "No active OTP found for the given user and purpose"
            };
        }

        const suppliedHash = this.hashOtp(
            input.otp
        );

        const isValid = crypto.timingSafeEqual(
            Buffer.from(suppliedHash, "hex"),
            Buffer.from(otp.otpHash, "hex")
        );

        if (!isValid) {
            const updated = await this.otpRepository.incrementAttempts(
                otp.id
            );

            if (
                updated.attempts >=
                this.MAX_ATTEMPTS
            ) {
                return {
                    verified: false,
                    purpose: input.purpose,
                    reason: "Maximum attempts exceeded. OTP is now invalidated."
                }
            }

            return {
                verified: false,
                purpose: input.purpose,
                reason: "Invalid OTP. Please try again."
            };
        }

        await this.otpRepository.markUsed(
            otp.id
        );

        return {
            verified: true,
            purpose: input.purpose,
            verifiedAt: new Date()
        }
    }
}

export const otpService = new OtpService(
    otpRepository,
    otpDeliveryService
);