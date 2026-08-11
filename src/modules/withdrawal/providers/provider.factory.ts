import { DummyWithdrawalProvider } from "./dummy-withdrawal.provider";
import { MidtransPayoutProvider } from "./midtrans-payout.provider";

export function getWithdrawalProvider() {
    switch(
        process.env.WITHDRAWAL_PROVIDER
    ) {
        case "MIDTRANS":
            return new MidtransPayoutProvider();

        case "DUMMY":
        default: 
            return new DummyWithdrawalProvider();
    }
}