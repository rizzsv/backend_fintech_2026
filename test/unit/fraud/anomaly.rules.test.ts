import {
    describe,
    it,
    expect,
} from "vitest";

import {
    evaluateAnomaly,
} from "../../../src/modules/fraud/rules/anomaly.rules";

describe(
    "Anomaly Detection Rules",
    () => {

        it(
            "should detect abnormal transaction amount",
            () => {

                const result =
                    evaluateAnomaly({
                        amount: 1_000_000,

                        averageAmount: 100_000,

                        transactionCount24h: 3,

                        averageTransactionCount24h: 3,
                    });

                expect(
                    result.detected
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "TRANSACTION_AMOUNT_ANOMALY"
                );
            }
        );

        it(
            "should detect abnormal transaction frequency",
            () => {

                const result =
                    evaluateAnomaly({
                        amount: 100_000,

                        averageAmount: 100_000,

                        transactionCount24h: 15,

                        averageTransactionCount24h: 3,
                    });

                expect(
                    result.detected
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "TRANSACTION_FREQUENCY_ANOMALY"
                );
            }
        );

        it(
            "should detect large transaction",
            () => {

                const result =
                    evaluateAnomaly({
                        amount: 30_000_000,

                        averageAmount: 10_000_000,

                        transactionCount24h: 2,

                        averageTransactionCount24h: 3,
                    });

                expect(
                    result.detected
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "LARGE_TRANSACTION_AMOUNT"
                );
            }
        );

        it(
            "should not detect anomaly for normal transaction",
            () => {

                const result =
                    evaluateAnomaly({
                        amount: 100_000,

                        averageAmount: 100_000,

                        transactionCount24h: 3,

                        averageTransactionCount24h: 3,
                    });

                expect(
                    result.detected
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