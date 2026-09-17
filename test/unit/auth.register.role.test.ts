import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';

import { AuthService } from '../../src/modules/auth/services/auth.service';
import { authRepository } from '../../src/modules/auth/repositories/auth.repository';

vi.mock('../../src/modules/auth/repositories/auth.repository', () => ({
  authRepository: {
    findByEmail: vi.fn(),
    findByPhoneNumber: vi.fn(),
    createRegistration: vi.fn(),
    createSession: vi.fn(),
  },
}));

vi.mock('../../src/shared/config/database', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock('../../src/shared/utils/password.utils', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  comparePassword: vi.fn(),
}));

vi.mock('../../src/shared/helper/emailVerification.helper', () => ({
  generateVerificationToken: vi.fn().mockReturnValue('verification-token'),
}));

vi.mock('../../src/shared/helper/refreshtoken.helper', () => ({
  hashToken: vi.fn((token: string) => token),
}));

vi.mock('../../src/modules/notification/service/notification.service', () => ({
  notificationService: { sendVerificationEmail: vi.fn() },
}));
describe('AuthService.register', () => {
  const service = new AuthService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds ADMIN role when the caller registers as an admin', async () => {
    process.env.APP_URL = 'https://api.example.com';
    vi.mocked(authRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.findByPhoneNumber).mockResolvedValue(null);
    vi.mocked(authRepository.createRegistration).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
    });

    await service.register({
      email: 'admin@example.com',
      phoneNumber: '081234567890',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    } as any);

    expect(authRepository.createRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRole.ADMIN,
        verificationTokenHash: 'verification-token',
      })
    );
  });
});
