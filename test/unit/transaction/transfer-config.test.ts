import { describe, expect, it } from "vitest";

import { TransactionService } from "../../../src/modules/transaction/services/transaction.service";
import { FeeConfig } from "../../../src/modules/fee/constants/fee.constants";
import {
    DAILY_TRANSFER_LIMIT,
    FRAUD,
} from "../../../src/modules/transaction/constants/transaction.constants";

const transactionService = new TransactionService();

describe("TransactionService.getTransferConfig", () => {
    it("reports the rules the service actually enforces", () => {
        expect(transactionService.getTransferConfig()).toEqual({
            fee: FeeConfig.TRANFER.amount,
            maxAmount: FRAUD.MAX_SINGGLE_TRANSFER,
            dailyLimit: DAILY_TRANSFER_LIMIT.BASIC,
            maxPerMinute: FRAUD.MAX_TRANSFER_PER_MINUTE,
        });
    });

    it("charges the transfer fee on top of the amount", () => {
        // Unlike a withdrawal, where the fee is carved out of the amount, the
        // sender here is debited `amount + fee`. A client that subtracted the
        // fee would understate the debit and allow an overdrawn transfer.
        const { fee } = transactionService.getTransferConfig();

        expect(fee).toBeGreaterThan(0);
        expect(fee).toBe(2500);
    });
});
