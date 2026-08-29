import {
    describe,
    it,
    expect,
} from "vitest";

import {
    calculateDistanceKm,
    evaluateGeolocation,
} from "../../../src/modules/fraud/rules/geolocation.rules";

describe(
    "Geolocation Rules",
    () => {

        it(
            "should calculate distance between coordinates",
            () => {

                const jakarta = {
                    latitude: -6.2088,
                    longitude: 106.8456,
                };

                const bandung = {
                    latitude: -6.9175,
                    longitude: 107.6191,
                };

                const distance =
                    calculateDistanceKm(
                        jakarta,
                        bandung
                    );

                expect(
                    distance
                ).toBeGreaterThan(100);

                expect(
                    distance
                ).toBeLessThan(200);
            }
        );

        it(
            "should detect suspicious distance",
            () => {

                const result =
                    evaluateGeolocation({

                        currentLocation: {
                            latitude: -7.2575,
                            longitude: 112.7521,
                        },

                        previousLocation: {
                            latitude: -6.2088,
                            longitude: 106.8456,
                        },

                        previousTransactionAt:
                            new Date(
                                Date.now() -
                                60 * 60 * 1000
                            ),

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "SUSPICIOUS_TRANSACTION_DISTANCE"
                );
            }
        );

        it(
            "should detect impossible travel",
            () => {

                const result =
                    evaluateGeolocation({

                        currentLocation: {
                            latitude: -7.2575,
                            longitude: 112.7521,
                        },

                        previousLocation: {
                            latitude: -6.2088,
                            longitude: 106.8456,
                        },

                        previousTransactionAt:
                            new Date(
                                Date.now() -
                                5 * 60 * 1000
                            ),

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "IMPOSSIBLE_TRAVEL"
                );
            }
        );

        it(
            "should detect untrusted location",
            () => {

                const result =
                    evaluateGeolocation({

                        currentLocation: {
                            latitude: -7.2575,
                            longitude: 112.7521,
                        },

                        trustedLocations: [
                            {
                                latitude: -6.2088,
                                longitude: 106.8456,
                            },
                        ],

                    });

                expect(
                    result.suspicious
                ).toBe(true);

                expect(
                    result.reasons
                ).toContain(
                    "UNTRUSTED_LOCATION"
                );
            }
        );

        it(
            "should allow trusted nearby location",
            () => {

                const result =
                    evaluateGeolocation({

                        currentLocation: {
                            latitude: -6.2088,
                            longitude: 106.8456,
                        },

                        trustedLocations: [
                            {
                                latitude: -6.2089,
                                longitude: 106.8457,
                            },
                        ],

                    });

                expect(
                    result.suspicious
                ).toBe(false);

                expect(
                    result.riskScore
                ).toBe(0);
            }
        );

        it(
            "should return no risk when there is no previous location",
            () => {

                const result =
                    evaluateGeolocation({

                        currentLocation: {
                            latitude: -6.2088,
                            longitude: 106.8456,
                        },

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