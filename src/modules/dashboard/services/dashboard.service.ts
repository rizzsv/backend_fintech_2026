import { PrismaKycRepository } from "../../kyc/repositories/prisma-kyc.repository";
import { userRepository } from "../../auth/repositories/user.repository";
import { walletRepository } from "../../wallet/repositories/wallet.repository";
import { transactionRepository } from "../../transaction/repositories/transaction.repository";
import { DashboardResponse } from "../types/dashboard.types";

export class DashboardService {
    constructor(
        private readonly userRepositoryClient: any,
        private readonly walletRepositoryClient: any,
        private readonly transactionRepositoryClient: any,
        private readonly kycRepositoryClient: any,
        private readonly securityRepositoryClient: any,
    ) {}

    async getDashboard(
        userId: string
    ): Promise<DashboardResponse> {

        const [
            user,
            wallet,
            userLimit,
            kyc,
            security,
            recentTransactions,
        ] = await Promise.all([

            this.userRepositoryClient.findById(userId),

            this.walletRepositoryClient.findByUserId(userId),

            this.walletRepositoryClient.findUserLimit?.(userId) ?? {
                dailyLimit: 0,
                monthlyLimit: 0,
                dailyUsed: 0,
                monthlyUsed: 0,
            },

            this.kycRepositoryClient.findByUserId?.(userId),

            this.securityRepositoryClient.getSecurityStatus?.(userId) ?? {
                emailVerified: false,
                twoFactorEnabled: false,
            },

            this.transactionRepositoryClient.getRecentTransactions?.(userId, 10) ?? [],

        ]);


        if (!user) {
            throw new Error("User not found");
        }


        if (!wallet) {
            throw new Error("Wallet not found");
        }


        const dailyLimit = Number(userLimit.dailyLimit ?? 0);
        const dailyUsed = Number(userLimit.dailyUsed ?? 0);

        const monthlyLimit = Number(userLimit.monthlyLimit ?? 0);
        const monthlyUsed = Number(userLimit.monthlyUsed ?? 0);


        return {

            user: {
                id:
                    user.id,

                firstName:
                    user.firstName,

                lastName:
                    user.lastName,

                email:
                    user.email,

                emailVerified:
                    user.emailVerified,
            },


            wallet: {
                balance:
                    wallet.balance.toNumber
                        ? wallet.balance.toNumber()
                        : Number(wallet.balance),

                currency:
                    wallet.currency,
            },


            limits: {

                dailyTransfer: {
                    limit:
                        dailyLimit,

                    used:
                        dailyUsed,

                    remaining:
                        Math.max(
                            dailyLimit - dailyUsed,
                            0
                        ),
                },


                monthlyTransfer: {
                    limit:
                        monthlyLimit,

                    used:
                        monthlyUsed,

                    remaining:
                        Math.max(
                            monthlyLimit - monthlyUsed,
                            0
                        ),
                },

            },


            kyc: {
                status:
                    kyc?.status ?? "NOT_STARTED",

                tier:
                    kyc?.tier ?? "BASIC",
            },


            security: {
                emailVerified:
                    security?.emailVerified ?? user.isEmailVerified ?? false,

                twoFactorEnabled:
                    security?.twoFactorEnabled ?? false,
            },


            recentTransactions:
                recentTransactions ?? [],
        };
    }
}

export const dashboardService = new DashboardService(
    userRepository,
    walletRepository,
    transactionRepository,
    new PrismaKycRepository(),
    {
        async getSecurityStatus() {
            return { twoFactorEnabled: false };
        },
    }
);