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
        wallet: Wallet
    ) {

        const total =
            await transactionRepository
                .countTransferLastMinute(
                    wallet.id
                );

        if (
            total >=
            FRAUD.MAX_TRANSFER_PER_MINUTE
        ) {

            /**
             * Logged here rather than after `validateTransfer` succeeds: an
             * unconditional log recorded FRAUD_DETECTED against every
             * legitimate transfer, which made the audit trail unusable for the
             * thing it exists to evidence.
             */
            await auditService.log({
                userId: wallet.userId,
                action: "FRAUD_DETECTED",
                resource: "TRANSFER",
                entityId: wallet.id,
                status: "FAILED",
                metadata: {
                    reason: "VELOCITY_LIMIT",
                    transfersLastMinute: total,
                    limit: FRAUD.MAX_TRANSFER_PER_MINUTE,
                },
            });

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
            sender
        );
    }
}

export const fraudService = new FraudService();