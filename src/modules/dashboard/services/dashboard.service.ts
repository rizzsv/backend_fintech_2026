import { Prisma } from "@prisma/client";
import { userRepository } from "../../auth/repositories/user.repository";
import { walletRepository } from "../../wallet/repositories/wallet.repository";
import { transactionRepository } from "../../transaction/repositories/transaction.repository";
import { DashboardResponse } from "../types/dashboard.types";

export class DashboardService {
    async getDashboard(userId: string): Promise<DashboardResponse> {
        const [
            user,
            wallet,
            userLimit,
            monthlyStats,
            cashFlowSeries,
            recentTransactions,
            pendingActivities,
        ] = await Promise.all([
            userRepository.findByIdForDashboard(userId),
            walletRepository.findByUserId(userId),
            walletRepository.getUserLimits(userId),
            transactionRepository.getMonthlyStatistics(userId),
            transactionRepository.getCashFlowSeries(userId, 7),
            transactionRepository.getRecentTransactions(userId, 5),
            transactionRepository.getPendingActivities(userId),
        ]);

        if (!user) {
            throw new Error("User not found");
        }

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        // Determine action eligibility based on user and wallet state
        const canTopUp = user.isActive;
        const canTransfer = user.isActive && !wallet.isFrozen && user.kycStatus === "APPROVED";
        const canWithdraw = user.isActive && !wallet.isFrozen && user.kycStatus === "APPROVED";

        // Safe Decimal conversions to string
        const balanceStr = wallet.balance.toFixed(2);

        // Limit calculations
        const dailyLimitDecimal = userLimit?.dailyLimit ?? new Prisma.Decimal(0);
        const dailyUsedDecimal = userLimit?.dailyUsed ?? new Prisma.Decimal(0);
        const monthlyLimitDecimal = userLimit?.monthlyLimit ?? new Prisma.Decimal(0);
        const monthlyUsedDecimal = userLimit?.monthlyUsed ?? new Prisma.Decimal(0);

        const dailyRemaining = dailyLimitDecimal.minus(dailyUsedDecimal);
        const monthlyRemaining = monthlyLimitDecimal.minus(monthlyUsedDecimal);

        const dailyPercentage =
            dailyLimitDecimal.toNumber() > 0
                ? Math.round(
                      (dailyUsedDecimal.toNumber() / dailyLimitDecimal.toNumber()) * 100
                  )
                : 0;

        const monthlyPercentage =
            monthlyLimitDecimal.toNumber() > 0
                ? Math.round(
                      (monthlyUsedDecimal.toNumber() / monthlyLimitDecimal.toNumber()) * 100
                  )
                : 0;

        // Monthly statistics
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Map recent transactions to response format
        const mappedRecentTransactions = recentTransactions.map((tx) => {
            const direction =
                tx.toWalletId === wallet.id && 
                (tx.transactionType === "TOPUP" || tx.transactionType === "TRANSFER")
                    ? "INCOME"
                    : "EXPENSE";

            return {
                id: tx.id,
                type: tx.transactionType,
                description: tx.description || null,
                amount: tx.amount.toFixed(2),
                currency: wallet.currency,
                direction,
                status: tx.status,
                reference: tx.referenceNumber || null,
                createdAt: tx.createdAt.toISOString(),
            };
        });

        // Map pending activities to response format
        const mappedPendingActivities = pendingActivities.map((activity) => ({
            id: activity.id,
            type: activity.transactionType,
            description: activity.description || null,
            amount: activity.amount.toFixed(2),
            currency: wallet.currency,
            status: activity.status,
            createdAt: activity.createdAt.toISOString(),
        }));

        // Map cash flow series
        const mappedCashFlowSeries = cashFlowSeries.map((item) => ({
            date: item.date,
            income: item.income.toFixed(2),
            expense: item.expense.toFixed(2),
            net: item.net.toFixed(2),
        }));

        // Calculate cash flow totals
        const totalIncome = cashFlowSeries.reduce(
            (sum, item) => sum.plus(item.income),
            new Prisma.Decimal(0)
        );
        const totalExpense = cashFlowSeries.reduce(
            (sum, item) => sum.plus(item.expense),
            new Prisma.Decimal(0)
        );
        const netCashFlow = totalIncome.minus(totalExpense);

        return {
            user: {
                id: user.id,
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                email: user.email,
            },
            wallet: {
                balance: balanceStr,
                currency: wallet.currency,
                isFrozen: wallet.isFrozen,
                walletStatus: wallet.isFrozen ? "FROZEN" : "ACTIVE",
            },
            accountOverview: {
                isActive: user.isActive,
                isEmailVerified: user.isEmailVerified,
                kyc: {
                    status: user.kycStatus,
                    tier: user.kycTier,
                },
                actions: {
                    canTopUp,
                    canTransfer,
                    canWithdraw,
                },
            },
            monthlyStatistics: {
                period: {
                    type: "MONTH",
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString(),
                },
                totalTopUp: monthlyStats.totalTopUp.toFixed(2),
                totalTransfer: monthlyStats.totalTransfer.toFixed(2),
                totalWithdrawal: monthlyStats.totalWithdrawal.toFixed(2),
            },
            cashFlow: {
                period: "7D",
                income: totalIncome.toFixed(2),
                expense: totalExpense.toFixed(2),
                net: netCashFlow.toFixed(2),
                currency: wallet.currency,
                series: mappedCashFlowSeries,
            },
            limits: {
                dailyTransfer: {
                    limit: dailyLimitDecimal.toFixed(2),
                    used: dailyUsedDecimal.toFixed(2),
                    remaining: dailyRemaining.toFixed(2),
                    percentageUsed: dailyPercentage,
                },
                monthlyTransfer: {
                    limit: monthlyLimitDecimal.toFixed(2),
                    used: monthlyUsedDecimal.toFixed(2),
                    remaining: monthlyRemaining.toFixed(2),
                    percentageUsed: monthlyPercentage,
                },
            },
            recentTransactions: mappedRecentTransactions,
            pendingActivities: mappedPendingActivities,
        };
    }
}

export const dashboardService = new DashboardService();
