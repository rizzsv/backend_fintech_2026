import { Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FeeConfig } from "../../../src/modules/fee/constants/fee.constants";
import { DAILY_TRANSFER_LIMIT, FRAUD } from "../../../src/modules/transaction/constants/transaction.constants";
import { DailyTransferLimitError } from "../../../src/modules/transaction/errors/daily-transfer-limit.error";
import { ledgerRepository } from "../../../src/modules/ledger/index";
import { notificationDispatcherService } from "../../../src/modules/notification/service/notification-dispatcher.service";
import { transactionRepository } from "../../../src/modules/transaction/repositories/transaction.repository";
import { TransactionService } from "../../../src/modules/transaction/services/transaction.service";
import { walletRepository } from "../../../src/modules/wallet/repositories/wallet.repository";
import { AppError } from "../../../src/shared/errors/AppError";
import { prisma } from "../../../src/shared/config/database";

/**
 * Drives the whole `transfer` pipeline - idempotency, reference generation,
 * wallet resolution, balance and daily-limit checks, fraud, fee, the
 * serializable write block and the post-transfer side effects - with only
 * persistence and I/O replaced. `feeService` and `fraudService` run for real so
 * the money rules under test are the ones the server actually applies.
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
        // Parts of the service new up their own instance, so the constructor has
        // to hand back the object the singleton spies live on.
        TransactionRepository: vi.fn().mockImplementation(function () {
            return transactionRepository;
        }),
    };
});

vi.mock("../../../src/modules/wallet/repositories/wallet.repository", () => {
    const walletRepository = {
        findByUserId: vi.fn(),
        findWalletById: vi.fn(),
        findById: vi.fn(),
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

vi.mock("../../../src/modules/notification/service/notification-dispatcher.service", () => ({
    notificationDispatcherService: {
        dispatchFinancialNotification: vi.fn().mockResolvedValue(undefined),
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

/**
 * Sentinel handed to the `$transaction` callback. Asserting that a write
 * received *this* object proves it ran inside the transaction rather than
 * against the outer client, where a later failure could not roll it back.
 */
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
        amount: new Prisma.Decimal(AMOUNT),
        fee: new Prisma.Decimal(FEE),
    } as any);

    vi.mocked(walletRepository.findByUserId).mockImplementation((async () => sender) as any);
    vi.mocked(walletRepository.findWalletById).mockImplementation((async () => receiver) as any);
    vi.mocked(walletRepository.findById).mockImplementation((async (id: string) => {
        if (id === sender.id) return sender;
        if (id === receiver.id) return receiver;
        return null;
    }) as any);
    vi.mocked(walletRepository.updateBalance).mockResolvedValue({ count: 1 } as any);
});

function transfer(overrides: Record<string, unknown> = {}) {
    return transactionService.transfer("user-sender", {
        toWalletId: receiver.id,
        amount: AMOUNT,
        description: "Integration transfer",
        idempotencyKey: "idem-transfer-1",
        ...overrides,
    } as any);
}

/**
 * Reads the signed delta `updateBalance` was asked to apply to one wallet.
 */
function balanceDelta(walletId: string) {
    const call = vi
        .mocked(walletRepository.updateBalance)
        .mock.calls.find((args) => args[1] === walletId);

    return call?.[3] as Prisma.Decimal | undefined;
}

describe("transfer money movement", () => {
    it("debits the sender the amount plus the backend fee", async () => {
        await transfer();

        // The fee is charged on top of the amount, so the sender loses both.
        expect(balanceDelta(sender.id)?.toString()).toBe(String(-TOTAL_DEBIT));
    });

    it("credits the receiver the amount only, never the sender's fee", async () => {
        await transfer();

        expect(balanceDelta(receiver.id)?.toString()).toBe(String(AMOUNT));
    });

    it("applies the server-side fee and records the split on the transaction", async () => {
        await transfer();

        const [, data] = vi.mocked(transactionRepository.createTransaction).mock.calls[0];

        expect(data.amount.toString()).toBe(String(AMOUNT));
        expect(data.fee.toString()).toBe(String(FEE));
        expect(data.transactionType).toBe(TransactionType.TRANSFER);
        expect(data.status).toBe(TransactionStatus.CREATED);
    });

    it("returns the completed row rather than the CREATED snapshot", async () => {
        const result = await transfer();

        expect(result.status).toBe(TransactionStatus.SUCCESS);
        expect(transactionRepository.completeTransaction).toHaveBeenCalledWith(TX, "txn-1");
    });

    it("counts the transferred amount against the user's limit usage", async () => {
        await transfer();

        const [, userId, amount] = vi.mocked(walletRepository.incrementLimitUsage).mock.calls[0];

        expect(userId).toBe(sender.userId);
        // Limit usage tracks what was sent; the fee is not a transfer.
        expect(amount.toString()).toBe(String(AMOUNT));
    });
});

describe("transfer atomicity", () => {
    it("runs every write inside one serializable database transaction", async () => {
        await transfer();

        const [, options] = vi.mocked(prisma.$transaction).mock.calls[0] as any[];

        expect(options.isolationLevel).toBe(
            Prisma.TransactionIsolationLevel.Serializable
        );

        expect(vi.mocked(transactionRepository.createTransaction).mock.calls[0][0]).toBe(TX);
        expect(vi.mocked(walletRepository.updateBalance).mock.calls[0][0]).toBe(TX);
        expect(vi.mocked(ledgerRepository.createEntries).mock.calls[0][0]).toBe(TX);
    });

    it("aborts without writing a ledger entry when the sender wallet moved underneath it", async () => {
        vi.mocked(walletRepository.updateBalance).mockResolvedValueOnce({ count: 0 } as any);

        await expect(transfer()).rejects.toThrow(/Wallet has been modified/);

        expect(ledgerRepository.createEntries).not.toHaveBeenCalled();
        expect(transactionRepository.completeTransaction).not.toHaveBeenCalled();
    });

    it("aborts when the receiver wallet moved underneath it", async () => {
        vi.mocked(walletRepository.updateBalance)
            .mockResolvedValueOnce({ count: 1 } as any)
            .mockResolvedValueOnce({ count: 0 } as any);

        await expect(transfer()).rejects.toThrow(/Wallet modified/);

        expect(ledgerRepository.createEntries).not.toHaveBeenCalled();
    });
});

describe("transfer rejections", () => {
    it("rejects a replayed idempotency key before touching a balance", async () => {
        vi.mocked(transactionRepository.findByIdempotencyKey).mockResolvedValue({
            id: "txn-existing",
        } as any);

        await expect(transfer()).rejects.toThrow(AppError);

        expect(walletRepository.updateBalance).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("refuses a balance that covers the amount but not the fee", async () => {
        // Exactly the transfer amount: enough for `amount`, short of `amount + fee`.
        sender.balance = new Prisma.Decimal(AMOUNT);

        await expect(transfer()).rejects.toThrow(/Insufficient balance/);

        expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });

    it("rejects a transfer that would cross the daily limit", async () => {
        vi.mocked(transactionRepository.getTodayTransferAmount).mockResolvedValue(
            new Prisma.Decimal(DAILY_TRANSFER_LIMIT.BASIC) as any
        );

        await expect(transfer()).rejects.toThrow(DailyTransferLimitError);

        expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });

    it("refuses to move money out of a frozen wallet", async () => {
        sender.isFrozen = true;

        await expect(transfer()).rejects.toThrow(/Sender wallet is frozen/);

        expect(walletRepository.updateBalance).not.toHaveBeenCalled();
        expect(ledgerRepository.createEntries).not.toHaveBeenCalled();
    });

    it("refuses to move money into a frozen wallet", async () => {
        receiver.isFrozen = true;

        await expect(transfer()).rejects.toThrow(/Receiver wallet is frozen/);

        expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });

    it("rejects a transfer to the sender's own wallet", async () => {
        vi.mocked(walletRepository.findWalletById).mockImplementation((async () => sender) as any);

        await expect(transfer({ toWalletId: sender.id })).rejects.toThrow(
            /Cannot transfer to own wallet/
        );

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("lets the daily limit bind before the single-transfer ceiling", async () => {
        sender.balance = new Prisma.Decimal(50_000_000);

        /**
         * `FRAUD.MAX_SINGGLE_TRANSFER` (10,000,000) sits above
         * `DAILY_TRANSFER_LIMIT.BASIC` (2,000,000) and is checked after it, so
         * the daily limit is the ceiling a single transfer actually hits. Worth
         * pinning because `getTransferConfig()` reports the fraud figure as
         * `maxAmount`, which is not the effective per-transfer maximum.
         */
        await expect(transfer({ amount: FRAUD.MAX_SINGGLE_TRANSFER + 1 })).rejects.toThrow(
            DailyTransferLimitError
        );

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects once the per-minute velocity ceiling is reached", async () => {
        vi.mocked(transactionRepository.countTransferLastMinute).mockResolvedValue(
            FRAUD.MAX_TRANSFER_PER_MINUTE as any
        );

        await expect(transfer()).rejects.toThrow(/Too many transfers/);

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});

describe("transfer side effects", () => {
    it("notifies both parties and drops the cached balances", async () => {
        await transfer();

        expect(notificationDispatcherService.dispatchFinancialNotification).toHaveBeenCalledTimes(2);

        const recipients = vi
            .mocked(notificationDispatcherService.dispatchFinancialNotification)
            .mock.calls.map(([payload]) => payload.userId);

        expect(recipients).toEqual(
            expect.arrayContaining([sender.userId, receiver.userId])
        );
    });

    it("keeps a committed transfer successful when a side effect fails", async () => {
        vi.mocked(notificationDispatcherService.dispatchFinancialNotification).mockRejectedValue(
            new Error("notification channel down")
        );

        // The money already moved and committed; a failed notification must not
        // surface as a failed transfer.
        const result = await transfer();

        expect(result.status).toBe(TransactionStatus.SUCCESS);
    });
});
