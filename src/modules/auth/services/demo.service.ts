import { Prisma } from '@prisma/client';
import { prisma } from '../../../shared/config/database';
import { generateAccessToken, generateRefreshToken } from '../../../shared/utils/token.utils';
import { hashToken } from '../../../shared/helper/refreshtoken.helper';
import { hashPassword } from '../../../shared/utils/password.utils';
import { randomUUID } from 'crypto';
import { generateAccountNumber } from '../../../shared/utils/account-number.utils';

export class DemoService {
    /**
     * Create a new isolated demo account with initial demo data
     */
    async createDemoAccount() {
        // Generate unique demo email
        const demoId = randomUUID();
        const email = `demo-${demoId}@veyra.demo`;
        const phoneNumber = `+62${Date.now().toString().slice(-10)}`;
        
        // Use a well-known demo password (not exposed to user)
        const passwordHash = await hashPassword('demo123456');
        
        // Create user, wallet, and initial demo data in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create demo user
            const user = await tx.user.create({
                data: {
                    email,
                    phoneNumber,
                    passwordHash,
                    firstName: 'Demo',
                    lastName: 'User',
                    isEmailVerified: true, // Demo accounts skip email verification
                    isDemo: true,
                    isActive: true,
                    kycStatus: 'PENDING',
                    kycTier: 'BASIC',
                },
            });

            // Create wallet with initial demo balance
            const wallet = await tx.wallet.create({
                data: {
                    userId: user.id,
                    currency: 'IDR',
                    balance: new Prisma.Decimal(1000000), // Rp 1.000.000
                    accountNumber: generateAccountNumber(),
                },
            });

            // Create user limit
            await tx.userLimit.create({
                data: {
                    userId: user.id,
                    dailyLimit: new Prisma.Decimal(10000000), // Rp 10 juta
                    monthlyLimit: new Prisma.Decimal(50000000), // Rp 50 juta
                    dailyUsed: new Prisma.Decimal(0),
                    monthlyUsed: new Prisma.Decimal(0),
                },
            });

            // Create initial demo transaction: funding
            const fundingTx = await tx.transaction.create({
                data: {
                    toWalletId: wallet.id,
                    amount: new Prisma.Decimal(1000000),
                    transactionType: 'TOPUP',
                    status: 'SUCCESS',
                    description: 'Initial demo funding',
                    referenceNumber: `DEMO-FUND-${user.id}`,
                    idempotencyKey: `demo-funding-${user.id}`,
                    completedAt: new Date(),
                    metadata: { isDemo: true },
                },
            });

            // Create ledger entry for funding
            await tx.ledgerEntry.create({
                data: {
                    transactionId: fundingTx.id,
                    walletId: wallet.id,
                    entryType: 'CREDIT',
                    amount: new Prisma.Decimal(1000000),
                    balanceAfter: new Prisma.Decimal(1000000),
                    description: 'Initial demo funding',
                },
            });

            // Create sample expense transaction
            const expenseTx = await tx.transaction.create({
                data: {
                    fromWalletId: wallet.id,
                    toWalletId: wallet.id, // Self transaction for demo
                    amount: new Prisma.Decimal(150000),
                    transactionType: 'TRANSFER',
                    status: 'SUCCESS',
                    description: 'Demo payment - Coffee subscription',
                    referenceNumber: `DEMO-PAY-${randomUUID()}`,
                    idempotencyKey: `demo-expense-${user.id}-1`,
                    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    metadata: { isDemo: true },
                },
            });

            // Create ledger entry for expense
            await tx.ledgerEntry.create({
                data: {
                    transactionId: expenseTx.id,
                    walletId: wallet.id,
                    entryType: 'DEBIT',
                    amount: new Prisma.Decimal(150000),
                    balanceAfter: new Prisma.Decimal(1000000), // Balance doesn't actually change for demo
                    description: 'Demo payment - Coffee subscription',
                },
            });

            // Create sample income transaction
            const incomeTx = await tx.transaction.create({
                data: {
                    toWalletId: wallet.id,
                    amount: new Prisma.Decimal(250000),
                    transactionType: 'TOPUP',
                    status: 'SUCCESS',
                    description: 'Demo top-up',
                    referenceNumber: `DEMO-TOP-${randomUUID()}`,
                    idempotencyKey: `demo-income-${user.id}-1`,
                    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                    metadata: { isDemo: true },
                },
            });

            await tx.ledgerEntry.create({
                data: {
                    transactionId: incomeTx.id,
                    walletId: wallet.id,
                    entryType: 'CREDIT',
                    amount: new Prisma.Decimal(250000),
                    balanceAfter: new Prisma.Decimal(1000000),
                    description: 'Demo top-up',
                },
            });

            return { user, wallet };
        });

        // Generate JWT tokens
        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashToken(refreshToken);

        const session = await prisma.session.create({
            data: {
                userId: result.user.id,
                refreshTokenHash,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
            },
        });

        const accessToken = generateAccessToken(result.user.id, session.id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                isDemo: result.user.isDemo,
            },
        };
    }

    /**
     * Reset demo account to initial state
     */
    async resetDemoAccount(userId: string) {
        // Verify user is actually a demo account
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.isDemo) {
            throw new Error('Can only reset demo accounts');
        }

        if (!user.wallet) {
            throw new Error('Wallet not found');
        }

        // Reset demo account in transaction
        await prisma.$transaction(async (tx) => {
            // Delete demo transactions
            await tx.transaction.deleteMany({
                where: {
                    OR: [
                        { fromWalletId: user.wallet!.id },
                        { toWalletId: user.wallet!.id },
                    ],
                },
            });

            // Delete ledger entries
            await tx.ledgerEntry.deleteMany({
                where: { walletId: user.wallet!.id },
            });

            // Reset wallet balance
            await tx.wallet.update({
                where: { id: user.wallet!.id },
                data: {
                    balance: new Prisma.Decimal(1000000),
                    version: 0,
                },
            });

            // Reset user limits
            await tx.userLimit.update({
                where: { userId: user.id },
                data: {
                    dailyUsed: new Prisma.Decimal(0),
                    monthlyUsed: new Prisma.Decimal(0),
                },
            });

            // Re-create initial demo transactions (same as createDemoAccount)
            const fundingTx = await tx.transaction.create({
                data: {
                    toWalletId: user.wallet!.id,
                    amount: new Prisma.Decimal(1000000),
                    transactionType: 'TOPUP',
                    status: 'SUCCESS',
                    description: 'Initial demo funding',
                    referenceNumber: `DEMO-FUND-${user.id}-${Date.now()}`,
                    idempotencyKey: `demo-funding-${user.id}-${Date.now()}`,
                    completedAt: new Date(),
                    metadata: { isDemo: true },
                },
            });

            await tx.ledgerEntry.create({
                data: {
                    transactionId: fundingTx.id,
                    walletId: user.wallet!.id,
                    entryType: 'CREDIT',
                    amount: new Prisma.Decimal(1000000),
                    balanceAfter: new Prisma.Decimal(1000000),
                    description: 'Initial demo funding',
                },
            });

            const expenseTx = await tx.transaction.create({
                data: {
                    fromWalletId: user.wallet!.id,
                    toWalletId: user.wallet!.id,
                    amount: new Prisma.Decimal(150000),
                    transactionType: 'TRANSFER',
                    status: 'SUCCESS',
                    description: 'Demo payment - Coffee subscription',
                    referenceNumber: `DEMO-PAY-${randomUUID()}`,
                    idempotencyKey: `demo-expense-${user.id}-${Date.now()}`,
                    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    metadata: { isDemo: true },
                },
            });

            await tx.ledgerEntry.create({
                data: {
                    transactionId: expenseTx.id,
                    walletId: user.wallet!.id,
                    entryType: 'DEBIT',
                    amount: new Prisma.Decimal(150000),
                    balanceAfter: new Prisma.Decimal(1000000),
                    description: 'Demo payment - Coffee subscription',
                },
            });

            const incomeTx = await tx.transaction.create({
                data: {
                    toWalletId: user.wallet!.id,
                    amount: new Prisma.Decimal(250000),
                    transactionType: 'TOPUP',
                    status: 'SUCCESS',
                    description: 'Demo top-up',
                    referenceNumber: `DEMO-TOP-${randomUUID()}`,
                    idempotencyKey: `demo-income-${user.id}-${Date.now()}`,
                    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    metadata: { isDemo: true },
                },
            });

            await tx.ledgerEntry.create({
                data: {
                    transactionId: incomeTx.id,
                    walletId: user.wallet!.id,
                    entryType: 'CREDIT',
                    amount: new Prisma.Decimal(250000),
                    balanceAfter: new Prisma.Decimal(1000000),
                    description: 'Demo top-up',
                },
            });
        });

        return { message: 'Demo account reset successfully' };
    }
}

export const demoService = new DemoService();
