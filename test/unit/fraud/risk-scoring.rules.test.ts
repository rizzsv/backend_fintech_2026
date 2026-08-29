import {
    describe,
    it,
    expect,
} from "vitest";

import {
    calculateRiskScore,
} from "../../../src/modules/fraud/rules/risk-scoring.rules";

describe(
    "Risk Scoring Rules",
    () => {

        it(
            "should calculate low risk",
            () => {

                const result =
                    calculateRiskScore({

                        velocity: {
                            score: 10,
                            reasons: [
                                "LOW_VELOCITY",
                            ],
                        },

                        anomaly: {
                            score: 5,
                            reasons: [
                                "NO_ANOMALY",
                            ],
                        },

                    });

                expect(
                    result.score
                ).toBe(15);

                expect(
                    result.level
                ).toBe("LOW");
            }
        );

        it(
            "should calculate medium risk",
            () => {

                const result =
                    calculateRiskScore({

                        velocity: {
                            score: 25,
                            reasons: [
                                "HIGH_VELOCITY",
                            ],
                        },

                        anomaly: {
                            score: 15,
                            reasons: [
                                "AMOUNT_ANOMALY",
                            ],
                        },

                    });

                expect(
                    result.score
                ).toBe(40);

                expect(
                    result.level
                ).toBe("MEDIUM");
            }
        );

        it(
            "should calculate high risk",
            () => {

                const result =
                    calculateRiskScore({

                        velocity: {
                            score: 30,
                            reasons: [
                                "VELOCITY_ANOMALY",
                            ],
                        },

                        anomaly: {
                            score: 25,
                            reasons: [
                                "AMOUNT_ANOMALY",
                            ],
                        },

                    });

                expect(
                    result.score
                ).toBe(55);

                expect(
                    result.level
                ).toBe("HIGH");
            }
        );

        it(
            "should calculate critical risk",
            () => {

                const result =
                    calculateRiskScore({

                        velocity: {
                            score: 40,
                            reasons: [
                                "EXTREME_VELOCITY",
                            ],
                        },

                        anomaly: {
                            score: 40,
                            reasons: [
                                "EXTREME_ANOMALY",
                            ],
                        },

                        device: {
                            score: 30,
                            reasons: [
                                "SUSPICIOUS_DEVICE",
                            ],
                        },

                    });

                expect(
                    result.score
                ).toBe(100);

                expect(
                    result.level
                ).toBe("CRITICAL");
            }
        );

        it(
            "should clamp score above 100",
            () => {

                const result =
                    calculateRiskScore({

                        velocity: {
                            score: 80,
                            reasons: [
                                "VELOCITY",
                            ],
                        },

                        anomaly: {
                            score: 80,
                            reasons: [
                                "ANOMALY",
                            ],
                        },

                    });

                expect(
                    result.score
                ).toBe(100);

                expect(
                    result.level
                ).toBe("CRITICAL");
            }
        );

        it(
            "should support optional fraud signals",
            () => {

                const result =
                    calculateRiskScore({

                        velocity: {
                            score: 20,
                            reasons: [
                                "VELOCITY",
                            ],
                        },

                        anomaly: {
                            score: 10,
                            reasons: [
                                "ANOMALY",
                            ],
                        },

                        geolocation: {
                            score: 20,
                            reasons: [
                                "GEOLOCATION_ANOMALY",
                            ],
                        },

                    });

                expect(
                    result.score
                ).toBe(50);

                expect(
                    result.level
                ).toBe("HIGH");

                expect(
                    result.reasons
                ).toContain(
                    "GEOLOCATION_ANOMALY"
                );
            }
        );

    }
);