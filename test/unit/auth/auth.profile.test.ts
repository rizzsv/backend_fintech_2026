import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { authRepository } from '../../../src/modules/auth/repositories/auth.repository';
import { DashboardService } from '../../../src/modules/dashboard/services/dashboard.service';
import { walletRepository } from '../../../src/modules/wallet/repositories/wallet.repository';
import { transactionRepository } from '../../../src/modules/transaction/repositories/transaction.repository';
import { userRepository } from '../../../src/modules/auth/repositories/user.repository';
import { KycStatus, KycTier, UserRole } from '@prisma/client';

vi.mock('../../../src/modules/auth/repositories/auth.repository', () => ({
  authRepository: {
    findById: vi.fn(),
  },
}));

describe('AuthService.me', () => {
  it('strips sensitive fields from profile response', async () => {
    const service = new AuthService();

    vi.mocked(authRepository.findById).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      phoneNumber: '081234567890',
      firstName: 'Rizq',
      lastName: 'Valeant',
      role: UserRole.USER,
      passwordHash: 'hashed-password',
      emailVerificationToken: 'secret-token',
      emailVerificationExpiresAt: new Date('2026-01-01T00:00:00Z'),
      deletedAt: null,
      kycDocumentPath: '/tmp/doc.pdf',
      kycSelfiePath: '/tmp/selfie.jpg',
      isActive: true,
      isEmailVerified: false,
      kycStatus: KycStatus.PENDING,
      kycTier: KycTier.BASIC,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as any);

    const profile = await service.me('user-1');

    expect(profile).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      phoneNumber: '081234567890',
      firstName: 'Rizq',
      lastName: 'Valeant',
      role: UserRole.USER,
      account: {
        isActive: true,
        isEmailVerified: false,
      },
      kyc: {
        status: KycStatus.PENDING,
        tier: KycTier.BASIC,
      },
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });
    expect(profile).not.toHaveProperty('isActive');
    expect(profile).not.toHaveProperty('isEmailVerified');
    expect(profile).not.toHaveProperty('kycStatus');
    expect(profile).not.toHaveProperty('kycTier');
    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).not.toHaveProperty('emailVerificationToken');
    expect(profile).not.toHaveProperty('emailVerificationExpiresAt');
    expect(profile).not.toHaveProperty('kycDocumentPath');
    expect(profile).not.toHaveProperty('kycSelfiePath');
    expect(profile).not.toHaveProperty('deletedAt');
  });
});

describe('DashboardService', () => {
  it('maps user limits from userLimit table into dashboard limits', async () => {
    const userRepo = { findById: vi.fn() };
    const walletRepo = {
      findByUserId: vi.fn(),
      findUserLimit: vi.fn(),
    };
    const txRepo = {
      getRecentTransactions: vi.fn(),
    };

    const service = new DashboardService(
      userRepo,
      walletRepo,
      txRepo,
      { findByUserId: vi.fn().mockResolvedValue({ status: KycStatus.PENDING, tier: KycTier.BASIC }) },
      { getSecurityStatus: vi.fn().mockResolvedValue({ emailVerified: false, twoFactorEnabled: false }) }
    );

    userRepo.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Rizq',
      lastName: 'Valeant',
      isEmailVerified: false,
      kycStatus: KycStatus.PENDING,
      kycTier: KycTier.BASIC,
    } as any);

    walletRepo.findByUserId.mockResolvedValue({
      balance: { toNumber: () => 2500000 },
      currency: 'IDR',
    } as any);

    walletRepo.findUserLimit.mockResolvedValue({
      dailyLimit: 10000000,
      monthlyLimit: 50000000,
      dailyUsed: 0,
      monthlyUsed: 0,
    } as any);

    txRepo.getRecentTransactions.mockResolvedValue([]);

    const dashboard = await service.getDashboard('user-1');

    expect(dashboard.limits).toEqual({
      dailyTransfer: {
        limit: 10000000,
        used: 0,
        remaining: 10000000,
      },
      monthlyTransfer: {
        limit: 50000000,
        used: 0,
        remaining: 50000000,
      },
    });
    expect(dashboard.security).toEqual({
      emailVerified: false,
      twoFactorEnabled: false,
    });
  });
});
