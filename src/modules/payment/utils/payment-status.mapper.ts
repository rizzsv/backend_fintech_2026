import { PaymentStatus } from "@prisma/client";

export function mapMidtransStatus(
    status: string
): PaymentStatus {

    switch (status) {

        case "settlement":

            return PaymentStatus.SUCCESS;

        case "capture":

            return PaymentStatus.SUCCESS;

        case "pending":

            return PaymentStatus.PENDING;

        case "expire":

            return PaymentStatus.EXPIRED;

        case "cancel":

            return PaymentStatus.FAILED;

        case "deny":

            return PaymentStatus.FAILED;

        default:

            return PaymentStatus.PENDING;

    }

}