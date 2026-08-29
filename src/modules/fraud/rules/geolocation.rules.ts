import {
    GeolocationContext,
    GeolocationResult,
    GeoPoint,
} from "../domain/fraud.types";

import {
    FRAUD_CONSTANTS,
} from "../domain/fraud.constants";


/**
 * Calculate distance between two coordinates
 * using Haversine formula.
 *
 * Result: kilometers.
 */
export function calculateDistanceKm(
    from: GeoPoint,
    to: GeoPoint
): number {

    const earthRadiusKm = 6371;

    const lat1 =
        toRadians(from.latitude);

    const lat2 =
        toRadians(to.latitude);

    const deltaLat =
        toRadians(
            to.latitude -
            from.latitude
        );

    const deltaLon =
        toRadians(
            to.longitude -
            from.longitude
        );


    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadiusKm * c;
}


function toRadians(
    degrees: number
): number {

    return degrees *
        (Math.PI / 180);
}


/**
 * Calculate required travel speed
 * between two transactions.
 */
export function calculateTravelSpeedKmh(
    distanceKm: number,
    previousTransactionAt: Date,
    currentTransactionAt: Date = new Date()
): number {

    const elapsedMs =
        currentTransactionAt.getTime() -
        previousTransactionAt.getTime();


    const elapsedHours =
        elapsedMs /
        (1000 * 60 * 60);


    if (elapsedHours <= 0) {
        return Infinity;
    }


    return distanceKm /
        elapsedHours;
}


export function evaluateGeolocation(
    context: GeolocationContext
): GeolocationResult {

    let riskScore = 0;

    const reasons: string[] = [];

    let distanceFromPreviousKm:
        number | undefined;

    let distanceFromTrustedKm:
        number | undefined;

    let travelSpeedKmh:
        number | undefined;


    /**
     * RULE 1
     *
     * Compare current transaction location
     * with previous transaction location.
     */
    if (
        context.previousLocation &&
        context.previousTransactionAt
    ) {

        distanceFromPreviousKm =
            calculateDistanceKm(
                context.previousLocation,
                context.currentLocation
            );


        if (
            distanceFromPreviousKm >=
            FRAUD_CONSTANTS.GEOLOCATION
                .SUSPICIOUS_DISTANCE_KM
        ) {

            riskScore +=
                FRAUD_CONSTANTS.GEOLOCATION
                    .DISTANCE_RISK_SCORE;

            reasons.push(
                "SUSPICIOUS_TRANSACTION_DISTANCE"
            );
        }


        travelSpeedKmh =
            calculateTravelSpeedKmh(
                distanceFromPreviousKm,
                context.previousTransactionAt
            );


        /**
         * IMPOSSIBLE TRAVEL
         *
         * Example:
         *
         * Jakarta
         * ↓
         * Surabaya
         *
         * in 10 minutes.
         *
         * Required speed could be
         * hundreds/thousands km/h.
         */
        if (
            travelSpeedKmh >=
            FRAUD_CONSTANTS.GEOLOCATION
                .MAX_TRAVEL_SPEED_KMH
        ) {

            riskScore +=
                FRAUD_CONSTANTS.GEOLOCATION
                    .IMPOSSIBLE_TRAVEL_RISK_SCORE;

            reasons.push(
                "IMPOSSIBLE_TRAVEL"
            );
        }
    }


    /**
     * RULE 2
     *
     * Compare current location against
     * user's trusted locations.
     */
    if (
        context.trustedLocations &&
        context.trustedLocations.length > 0
    ) {

        let nearestDistanceKm =
            Infinity;


        for (
            const trustedLocation
            of context.trustedLocations
        ) {

            const distance =
                calculateDistanceKm(
                    trustedLocation,
                    context.currentLocation
                );


            if (
                distance <
                nearestDistanceKm
            ) {

                nearestDistanceKm =
                    distance;
            }
        }


        distanceFromTrustedKm =
            nearestDistanceKm;


        if (
            nearestDistanceKm >
            FRAUD_CONSTANTS.GEOLOCATION
                .TRUSTED_LOCATION_RADIUS_KM
        ) {

            riskScore +=
                FRAUD_CONSTANTS.GEOLOCATION
                    .UNTRUSTED_LOCATION_RISK_SCORE;

            reasons.push(
                "UNTRUSTED_LOCATION"
            );
        }
    }


    return {

        suspicious:
            riskScore > 0,

        riskScore,

        reasons,

        distanceFromPreviousKm,

        distanceFromTrustedKm,

        travelSpeedKmh,

    };
}