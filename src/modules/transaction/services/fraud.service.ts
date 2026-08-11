import { Prisma, Wallet } from "@prisma/client";
import { FRAUD } from "../constants/transaction.constants";
import { transactionRepository } from "../repositories/transaction.repository";
import { auditService } from "../../audit/services/audit.services";

export class FraudService {
    private validateSelfTransfer(
        fromWalletId: string,
        toWalletId: string
    ) {
        if (fromWalletId === toWalletId) {
            throw new Error("Self-transfer is not allowed.");
        }
    }
    private validateAmount(
        amount: Prisma.Decimal,
    ) {
        if (
            amount.greaterThan(
                FRAUD.MAX_SINGGLE_TRANSFER
            )
        ) {
            throw new Error(
                `Transfer amount exceeds the maximum limit of ${FRAUD.MAX_SINGGLE_TRANSFER}`
            )
        }
    }

    private async validateVelocity(
        walletId: string
    ) {

        const total =
            await transactionRepository
                .countTransferLastMinute(
                    walletId
                );

        if (
            total >=
            FRAUD.MAX_TRANSFER_PER_MINUTE
        ) {

            throw new Error(
                "Too many transfers"
            );

        }
    }

        async validateTransfer(
        sender: Wallet,
        receiver: Wallet,
        amount: Prisma.Decimal
    ) {
        this.validateSelfTransfer(
            sender.id,
            receiver.id
        );

        this.validateAmount(amount);

        await this.validateVelocity(
            sender.id
        );

        await auditService.log({
            userId: sender.userId,
            action: "FRAUD_DETECTED",
            resource: "TRANSFER",
            entityId: sender.id,
            status: "FAILED",
            metadata: {
                reason: "VELOCITY_LIMIT",
            },
        });
    }
}

export const fraudService = new FraudService();