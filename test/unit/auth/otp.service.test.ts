import { describe, expect, it, vi } from 'vitest';
import { OtpPurpose } from '@prisma/client';

import { OtpService } from '../../../src/modules/auth/services/otp.service';

describe('OtpService.generate', () => {
  it('stores the hashed OTP before sending it', async () => {
    const otpRepository = {
      invalidateActive: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({ id: 'otp-1' }),
    } as any;

    const otpDeliveryService = {
      sendOtp: vi.fn().mockResolvedValue(undefined),
    };

    const service = new OtpService(otpRepository, otpDeliveryService);

    await service.generate({
      userId: 'user-1',
      purpose: OtpPurpose.LOGIN_2FA,
    });

    expect(otpRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: {
          connect: {
            id: 'user-1',
          },
        },
        purpose: OtpPurpose.LOGIN_2FA,
        otpHash: expect.any(String),
        expiresAt: expect.any(Date),
      })
    );
    expect(otpDeliveryService.sendOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        purpose: OtpPurpose.LOGIN_2FA,
        otp: expect.stringMatching(/^\d{6}$/),
      })
    );
  });
});
