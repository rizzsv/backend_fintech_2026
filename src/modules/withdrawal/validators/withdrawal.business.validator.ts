import { Prisma } from "@prisma/client";
import { WITHDRAWAL_CONSTANTS } from "../constants/withdrawal.constants";

export class WithdrawalBusinessValidator {
    validateAmount(
        amount: Prisma.Decimal
    ) {
        if (
            amount.lessThan(
                WITHDRAWAL_CONSTANTS.MIN_AMOUNT
            )
        ) {
            throw new Error(
                "Minimum withdrawal amount is " + WITHDRAWAL_CONSTANTS.MIN_AMOUNT
            )
        }

        if (
            amount.greaterThan(
                WITHDRAWAL_CONSTANTS.MAX_AMOUNT
            )
        ) {
            throw new Error(
                "Maximum withdrawal amount is " + WITHDRAWAL_CONSTANTS.MAX_AMOUNT
            )
        }
    }

    validateBalance(
        balance: Prisma.Decimal,
        amount: Prisma.Decimal
    ) {
        if (
            balance.lessThan(amount)
        ) {
            throw new Error(
                "Insufficient balance for withdrawal"
            )
        }
    }

    validateBankAccount(
        method: string,
        bankCode?: string,
        accountNumber?: string
    ) {
        if (
            method === "BANK_TRANSFER"
        ) {
            if (
                !bankCode || !accountNumber
            ) {
                throw new Error(
                    "Bank code and account number are required for bank transfer withdrawals"
                )
            }
        }
    }

    validateDailyLimit(
        total: Prisma.Decimal,
        amount: Prisma.Decimal
    ) {

        const after =
            total.plus(amount);


        if (
            after.greaterThan(
                WITHDRAWAL_CONSTANTS.DAILY_LIMIT
            )
        ) {

            throw new Error(
                "Daily withdrawal limit exceeded"
            );

        }

    }

    validateCooldown(
        lastWithdrawalTime: Date | null,
    ) {
        if (!lastWithdrawalTime) {
            return;
        }

        const diff = Date.now() - lastWithdrawalTime.getTime();

        const minutes = diff / (1000 * 60);

        if (minutes < 10) {
            throw new Error(
                "You can only make a withdrawal every 10 minutes"
            )
        }
    }
}

export const withdrawalBusinessValidator = new WithdrawalBusinessValidator();