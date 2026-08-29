import {
    SuspiciousActivityContext,
    suspiciousActivityResult,
} from "../domain/fraud.types";

import {
    evaluateSuspiciousActivity,
} from "../rules/suspicious-activity.rules";


export class SuspiciousActivityService {

    evaluate(
        context: SuspiciousActivityContext
    ): suspiciousActivityResult {

        return evaluateSuspiciousActivity(
            context
        );
    }
}


export const suspiciousActivityService =
    new SuspiciousActivityService();