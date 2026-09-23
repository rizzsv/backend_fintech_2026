import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { authRepository } from '../../../src/modules/auth/repositories/auth.repository';
import { DashboardService } from '../../../src/modules/dashboard/services/dashboard.service';
import { walletRepository } from '../../../src/modules/wallet/repositories/wallet.repository';
import { transactionRepository } from '../../../src/modules/transaction/repositories/transaction.repository';
import { userRepository } from '../../../src/modules/auth/repositories/user.repository';
import { KycStatus, KycTier, Prisma, UserRole } from '@prisma/client';

vi.mock('../../../src/modules/auth/repositories/auth.repository', () => ({
  authRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../../../src/modules/auth/repositories/user.repository', () => ({
  userRepository: {
    findByIdForDashboard: vi.fn(),
  },
}));

vi.mock('../../../src/modules/wallet/repositories/wallet.repository', () => ({
  walletRepository: {
    findByUserId: vi.fn(),
    findUserLimit: vi.fn(),
  },
}));

vi.mock('../../../src/modules/transaction/repositories/transaction.repository', () => ({
  transactionRepository: {
    getMonthlyStatistics: vi.fn(),
    getCashFlowSeries: vi.fn(),
    getRecentTransactions: vi.fn(),
    getPendingActivities: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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
    const service = new DashboardService();

    vi.mocked(userRepository.findByIdForDashboard).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Rizq',
      lastName: 'Valeant',
      isActive: true,
      isEmailVerified: false,
      kycStatus: KycStatus.PENDING,
      kycTier: KycTier.BASIC,
      has2FA: false,
    } as any);

    vi.mocked(walletRepository.findByUserId).mockResolvedValue({
      id: 'wallet-1',
      balance: new Prisma.Decimal(2_500_000),
      currency: 'IDR',
      isFrozen: false,
    } as any);

    vi.mocked(walletRepository.findUserLimit).mockResolvedValue({
      dailyLimit: new Prisma.Decimal(10_000_000),
      monthlyLimit: new Prisma.Decimal(50_000_000),
      dailyUsed: new Prisma.Decimal(2_500_000),
      monthlyUsed: new Prisma.Decimal(0),
    } as any);

    vi.mocked(transactionRepository.getMonthlyStatistics).mockResolvedValue({
      totalTopUp: new Prisma.Decimal(0),
      totalTransfer: new Prisma.Decimal(0),
      totalWithdrawal: new Prisma.Decimal(0),
    } as any);

    vi.mocked(transactionRepository.getCashFlowSeries).mockResolvedValue([] as any);
    vi.mocked(transactionRepository.getRecentTransactions).mockResolvedValue([] as any);
    vi.mocked(transactionRepository.getPendingActivities).mockResolvedValue([] as any);

    const dashboard = await service.getDashboard('user-1');

    // Monetary values are serialised as fixed-point strings so Decimal
    // precision survives the JSON boundary.
    expect(dashboard.limits).toEqual({
      dailyTransfer: {
        limit: '10000000.00',
        used: '2500000.00',
        remaining: '7500000.00',
        percentageUsed: 25,
      },
      monthlyTransfer: {
        limit: '50000000.00',
        used: '0.00',
        remaining: '50000000.00',
        percentageUsed: 0,
      },
    });

    expect(dashboard.accountOverview).toEqual({
      isActive: true,
      isEmailVerified: false,
      kyc: {
        status: KycStatus.PENDING,
        tier: KycTier.BASIC,
      },
      actions: {
        // Transfer and withdrawal both require an approved KYC.
        canTopUp: true,
        canTransfer: false,
        canWithdraw: false,
      },
    });
  });

  it('falls back to zeroed limits when the user has no limit row', async () => {
    const service = new DashboardService();

    vi.mocked(userRepository.findByIdForDashboard).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
      isActive: true,
      isEmailVerified: true,
      kycStatus: KycStatus.APPROVED,
      kycTier: KycTier.BASIC,
      has2FA: false,
    } as any);

    vi.mocked(walletRepository.findByUserId).mockResolvedValue({
      id: 'wallet-1',
      balance: new Prisma.Decimal(0),
      currency: 'IDR',
      isFrozen: false,
    } as any);

    vi.mocked(walletRepository.findUserLimit).mockResolvedValue(null as any);

    vi.mocked(transactionRepository.getMonthlyStatistics).mockResolvedValue({
      totalTopUp: new Prisma.Decimal(0),
      totalTransfer: new Prisma.Decimal(0),
      totalWithdrawal: new Prisma.Decimal(0),
    } as any);

    vi.mocked(transactionRepository.getCashFlowSeries).mockResolvedValue([] as any);
    vi.mocked(transactionRepository.getRecentTransactions).mockResolvedValue([] as any);
    vi.mocked(transactionRepository.getPendingActivities).mockResolvedValue([] as any);

    const dashboard = await service.getDashboard('user-1');

    // Guards the zero-division branch of the percentage calculation.
    expect(dashboard.limits.dailyTransfer).toEqual({
      limit: '0.00',
      used: '0.00',
      remaining: '0.00',
      percentageUsed: 0,
    });
    expect(dashboard.accountOverview.actions).toEqual({
      canTopUp: true,
      canTransfer: true,
      canWithdraw: true,
    });
  });

  it('does not expose sensitive user fields', async () => {
    const service = new DashboardService();

    vi.mocked(userRepository.findByIdForDashboard).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Rizq',
      lastName: 'Valeant',
      isActive: true,
      isEmailVerified: true,
      kycStatus: KycStatus.APPROVED,
      kycTier: KycTier.BASIC,
      has2FA: false,
    } as any);

    vi.mocked(walletRepository.findByUserId).mockResolvedValue({
      id: 'wallet-1',
      balance: new Prisma.Decimal(0),
      currency: 'IDR',
      isFrozen: false,
    } as any);

    vi.mocked(walletRepository.findUserLimit).mockResolvedValue(null as any);

    vi.mocked(transactionRepository.getMonthlyStatistics).mockResolvedValue({
      totalTopUp: new Prisma.Decimal(0),
      totalTransfer: new Prisma.Decimal(0),
      totalWithdrawal: new Prisma.Decimal(0),
    } as any);

    vi.mocked(transactionRepository.getCashFlowSeries).mockResolvedValue([] as any);
    vi.mocked(transactionRepository.getRecentTransactions).mockResolvedValue([] as any);
    vi.mocked(transactionRepository.getPendingActivities).mockResolvedValue([] as any);

    const dashboard = await service.getDashboard('user-1');

    expect(dashboard.user).toEqual({
      id: 'user-1',
      firstName: 'Rizq',
      lastName: 'Valeant',
      email: 'user@example.com',
    });
    expect(dashboard.user).not.toHaveProperty('passwordHash');
    expect(dashboard.user).not.toHaveProperty('emailVerificationToken');
    expect(dashboard.user).not.toHaveProperty('kycDocumentPath');
    expect(dashboard.user).not.toHaveProperty('kycSelfiePath');
  });
});
