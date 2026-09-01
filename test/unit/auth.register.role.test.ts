import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';

import { AuthService } from '../../src/modules/auth/services/auth.service';
import { authRepository } from '../../src/modules/auth/repositories/auth.repository';
import { prisma } from '../../src/shared/config/database';

vi.mock('../../src/modules/auth/repositories/auth.repository', () => ({
  authRepository: {
    findByEmail: vi.fn(),
    findByPhoneNumber: vi.fn(),
    createUser: vi.fn(),
    createWallet: vi.fn(),
    createUserLimit: vi.fn(),
    updateVerificationTokenRegister: vi.fn(),
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

describe('AuthService.register', () => {
  const service = new AuthService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds ADMIN role when the caller registers as an admin', async () => {
    const tx = { user: {} };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(tx));
    vi.mocked(authRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.findByPhoneNumber).mockResolvedValue(null);
    vi.mocked(authRepository.createUser).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      phoneNumber: '081234567890',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    } as any);

    await service.register({
      email: 'admin@example.com',
      phoneNumber: '081234567890',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    } as any);

    expect(authRepository.createUser).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        role: UserRole.ADMIN,
      })
    );
  });
});
