import {
    describe,
    it,
    expect,
} from "vitest";

import {
    evaluateSuspiciousActivity,
} from "../../../src/modules/fraud/rules/suspicious-activity.rules";

describe(
    "Suspicious Activity Rules",
    () => {

        it(
            "should detect high transaction frequency in 1 minute",
            () => {

                const result =
                    evaluateSuspiciousActivity({

                        userId: "user-1",

                        transactionCount1m: 10,

                        transactionCount1h: 10,

                        failedTransactionCount1h: 0,

                        currentAmount: 100_000,

                        averageTransactionAmount24h: 100_000,

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "HIGH_TRANSACTION_FREQUENCY_1M"
                );
            }
        );

        it(
            "should detect high transaction frequency in 1 hour",
            () => {

                const result =
                    evaluateSuspiciousActivity({

                        userId: "user-1",

                        transactionCount1m: 0,

                        transactionCount1h: 30,

                        failedTransactionCount1h: 0,

                        currentAmount: 100_000,

                        averageTransactionAmount24h: 100_000,

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "HIGH_TRANSACTION_FREQUENCY_1H"
                );
            }
        );

        it(
            "should detect high failed transaction rate",
            () => {

                const result =
                    evaluateSuspiciousActivity({

                        userId: "user-1",

                        transactionCount1m: 0,

                        transactionCount1h: 5,

                        failedTransactionCount1h: 10,

                        currentAmount: 100_000,

                        averageTransactionAmount24h: 100_000,

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "HIGH_FAILED_TRANSACTION_RATE"
                );
            }
        );

        it(
            "should detect transaction amount spike",
            () => {

                const result =
                    evaluateSuspiciousActivity({

                        userId: "user-1",

                        transactionCount1m: 1,

                        transactionCount1h: 5,

                        failedTransactionCount1h: 0,

                        currentAmount: 1_000_000,

                        averageTransactionAmount24h: 100_000,

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "TRANSACTION_AMOUNT_SPIKE"
                );
            }
        );

        it(
            "should detect dormant account activity",
            () => {

                const current =
                    new Date();

                const previous =
                    new Date(
                        current.getTime() -
                        100 * 60 * 60 * 1000
                    );

                const result =
                    evaluateSuspiciousActivity({

                        userId: "user-1",

                        transactionCount1m: 1,

                        transactionCount1h: 1,

                        failedTransactionCount1h: 0,

                        currentAmount: 100_000,

                        averageTransactionAmount24h: 100_000,

                        lastActivityAt: previous,

                        currentActivityAt: current,

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "DORMANT_ACCOUNT_ACTIVITY"
                );
            }
        );

        it(
            "should allow normal activity",
            () => {

                const result =
                    evaluateSuspiciousActivity({

                        userId: "user-1",

                        transactionCount1m: 1,

                        transactionCount1h: 5,

                        failedTransactionCount1h: 0,

                        currentAmount: 100_000,

                        averageTransactionAmount24h: 100_000,

                    });

                expect(
                    result.suspicious
                ).toBe(false);

                expect(
                    result.riskScore
                ).toBe(0);

                expect(
                    result.reasons
                ).toHaveLength(0);
            }
        );

    }
);
