import { EntryType, Prisma, TransactionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FeeConfig } from "../../../src/modules/fee/constants/fee.constants";
import { ledgerRepository } from "../../../src/modules/ledger/index";
import { transactionRepository } from "../../../src/modules/transaction/repositories/transaction.repository";
import { TransactionService } from "../../../src/modules/transaction/services/transaction.service";
import { walletRepository } from "../../../src/modules/wallet/repositories/wallet.repository";
import { prisma } from "../../../src/shared/config/database";

/**
 * `walletRepository.getLedger` serves these rows straight to the account holder
 * as a statement, so every entry has to be readable on its own: the figure it
 * records must be the figure that moved, and `balanceAfter` must be what you get
 * by applying it to the opening balance. This pins that for the transfer path,
 * where the fee is charged on top of the amount and so is easy to lose.
 */

vi.mock("../../../src/shared/config/database", () => ({
    prisma: {
        $transaction: vi.fn(),
    },
}));

vi.mock("../../../src/modules/transaction/repositories/transaction.repository", () => {
    const transactionRepository = {
        findByIdempotencyKey: vi.fn(),
        findByReferenceNumber: vi.fn(),
        getTodayTransferAmount: vi.fn(),
        countTransferLastMinute: vi.fn(),
        createTransaction: vi.fn(),
        updateStatus: vi.fn(),
        createLog: vi.fn(),
        completeTransaction: vi.fn(),
    };

    return {
        transactionRepository,
        TransactionRepository: vi.fn().mockImplementation(function () {
            return transactionRepository;
        }),
    };
});

vi.mock("../../../src/modules/wallet/repositories/wallet.repository", () => {
    const walletRepository = {
        findByUserId: vi.fn(),
        findWalletById: vi.fn(),
        updateBalance: vi.fn(),
        incrementLimitUsage: vi.fn(),
    };

    return {
        walletRepository,
        WalletRepository: vi.fn().mockImplementation(function () {
            return walletRepository;
        }),
    };
});

vi.mock("../../../src/modules/ledger/index", () => ({
    ledgerRepository: {
        createEntries: vi.fn(),
    },
}));

vi.mock("../../../src/modules/notification/service/notification.service", () => ({
    notificationService: {
        createNotification: vi.fn(),
    },
}));

// Opens a Redis connection on import, which is not available in test runs.
vi.mock("../../../src/shared/cache/wallet.cache", () => ({
    walletCache: {
        invalidateBalance: vi.fn(),
    },
}));

vi.mock("../../../src/modules/audit/services/audit.services", () => ({
    auditService: {
        log: vi.fn(),
    },
}));

const transactionService = new TransactionService();

const FEE = FeeConfig.TRANFER.amount;
const AMOUNT = 100_000;
const TOTAL_DEBIT = AMOUNT + FEE;
const SENDER_OPENING = 500_000;
const RECEIVER_OPENING = 250_000;

const TX = { __transaction: true };

let sender: any;
let receiver: any;

beforeEach(() => {
    vi.clearAllMocks();

    sender = {
        id: "wallet-sender",
        userId: "user-sender",
        balance: new Prisma.Decimal(SENDER_OPENING),
        version: 7,
        isFrozen: false,
    };

    receiver = {
        id: "wallet-receiver",
        userId: "user-receiver",
        balance: new Prisma.Decimal(RECEIVER_OPENING),
        version: 2,
        isFrozen: false,
    };

    vi.mocked(prisma.$transaction).mockImplementation(
        (async (callback: any) => callback(TX)) as any
    );

    vi.mocked(transactionRepository.findByIdempotencyKey).mockResolvedValue(null as any);
    vi.mocked(transactionRepository.findByReferenceNumber).mockResolvedValue(null as any);
    vi.mocked(transactionRepository.getTodayTransferAmount).mockResolvedValue(
        new Prisma.Decimal(0) as any
    );
    vi.mocked(transactionRepository.countTransferLastMinute).mockResolvedValue(0 as any);
    vi.mocked(transactionRepository.createTransaction).mockResolvedValue({
        id: "txn-1",
        status: TransactionStatus.CREATED,
    } as any);
    vi.mocked(transactionRepository.completeTransaction).mockResolvedValue({
        id: "txn-1",
        status: TransactionStatus.SUCCESS,
    } as any);

    vi.mocked(walletRepository.findByUserId).mockImplementation((async () => sender) as any);
    vi.mocked(walletRepository.findWalletById).mockImplementation((async () => receiver) as any);
    vi.mocked(walletRepository.updateBalance).mockResolvedValue({ count: 1 } as any);
});

function transfer(amount = AMOUNT) {
    return transactionService.transfer("user-sender", {
        toWalletId: receiver.id,
        amount,
        description: "Ledger transfer",
        idempotencyKey: "idem-ledger-1",
    } as any);
}

function writtenEntries() {
    const [, entries] = vi.mocked(ledgerRepository.createEntries).mock.calls[0];
    return entries;
}

function entryFor(type: EntryType) {
    const matches = writtenEntries().filter((candidate) => candidate.entryType === type);

    expect(matches).toHaveLength(1);

    return matches[0] as {
        transactionId: string;
        walletId: string;
        amount: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
    };
}

/**
 * The signed delta the wallet row was actually asked to move.
 */
function balanceDelta(walletId: string) {
    const call = vi
        .mocked(walletRepository.updateBalance)
        .mock.calls.find((args) => args[1] === walletId);

    return call?.[3] as Prisma.Decimal;
}

describe("transfer double entry", () => {
    it("writes one debit against the sender and one credit to the receiver", async () => {
        await transfer();

        expect(writtenEntries()).toHaveLength(2);
        expect(entryFor(EntryType.DEBIT).walletId).toBe(sender.id);
        expect(entryFor(EntryType.CREDIT).walletId).toBe(receiver.id);
    });

    it("binds both entries to the transaction that moved the money", async () => {
        await transfer();

        expect(entryFor(EntryType.DEBIT).transactionId).toBe("txn-1");
        expect(entryFor(EntryType.CREDIT).transactionId).toBe("txn-1");
    });

    it("records on the debit everything that left the sender's wallet", async () => {
        await transfer();

        // The fee is charged on top, so the wallet loses amount + fee. Recording
        // only `amount` would leave the fee out of the statement.
        expect(entryFor(EntryType.DEBIT).amount.toString()).toBe(String(TOTAL_DEBIT));
    });

    it("records on the credit exactly what reached the receiver", async () => {
        await transfer();

        expect(entryFor(EntryType.CREDIT).amount.toString()).toBe(String(AMOUNT));
    });

    it("keeps every entry in step with the balance the wallet row was moved by", async () => {
        await transfer();

        const debit = entryFor(EntryType.DEBIT);
        const credit = entryFor(EntryType.CREDIT);

        expect(debit.amount.negated().toString()).toBe(balanceDelta(sender.id).toString());
        expect(credit.amount.toString()).toBe(balanceDelta(receiver.id).toString());
    });

    it("lets each entry reproduce the balance it claims to end on", async () => {
        await transfer();

        const debit = entryFor(EntryType.DEBIT);
        const credit = entryFor(EntryType.CREDIT);

        expect(new Prisma.Decimal(SENDER_OPENING).minus(debit.amount).toString()).toBe(
            debit.balanceAfter.toString()
        );

        expect(new Prisma.Decimal(RECEIVER_OPENING).plus(credit.amount).toString()).toBe(
            credit.balanceAfter.toString()
        );
    });

    it("leaves the fee as the only part of the transfer without a counterparty entry", async () => {
        await transfer();

        /**
         * The debit exceeds the credit by exactly the fee. There is no platform
         * or revenue wallet in the schema and `EntryType` has only DEBIT and
         * CREDIT, so the fee has nowhere to land as a matching entry - the two
         * sides of a transfer sum to the fee rather than to zero. Pinned so the
         * gap is a known quantity rather than a surprise during reconciliation.
         */
        const difference = entryFor(EntryType.DEBIT).amount.minus(
            entryFor(EntryType.CREDIT).amount
        );

        expect(difference.toString()).toBe(String(FEE));
    });

    it("holds for an amount that is not a round figure", async () => {
        await transfer(37_499);

        const debit = entryFor(EntryType.DEBIT);

        expect(debit.amount.toString()).toBe(String(37_499 + FEE));
        expect(new Prisma.Decimal(SENDER_OPENING).minus(debit.amount).toString()).toBe(
            debit.balanceAfter.toString()
        );
    });
});

describe("ledger durability", () => {
    it("writes the entries inside the same database transaction as the balances", async () => {
        await transfer();

        const [tx] = vi.mocked(ledgerRepository.createEntries).mock.calls[0];

        // Written against the outer client, a later failure could not roll these
        // back and the statement would outlive the transfer it describes.
        expect(tx).toBe(TX);
        expect(vi.mocked(walletRepository.updateBalance).mock.calls[0][0]).toBe(TX);
    });

    it("writes nothing when the transfer never commits", async () => {
        vi.mocked(walletRepository.updateBalance).mockResolvedValueOnce({ count: 0 } as any);

        await expect(transfer()).rejects.toThrow(/Wallet has been modified/);

        expect(ledgerRepository.createEntries).not.toHaveBeenCalled();
    });
});
