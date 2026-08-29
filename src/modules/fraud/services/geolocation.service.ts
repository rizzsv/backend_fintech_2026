import { GeolocationContext, GeolocationResult } from "../domain/fraud.types";
import {
    evaluateGeolocation,
} from "../rules/geolocation.rules";


export class GeolocationService {

    evaluate(
        context: GeolocationContext
    ): GeolocationResult {

        return evaluateGeolocation(
            context
        );
    }
}


export const geolocationService =
    new GeolocationService();