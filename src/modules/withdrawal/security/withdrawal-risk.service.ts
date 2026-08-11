export class WithdrawalRiskService {
    check (
        amount: number
    ){
        if (amount > 10000000) {
            return {
                risky: true,
                reason: "Amount exceeds 10,000,000"
            };
        }

        return {
            risky: false,
        }
    }
}

export const withdrawalRiskService = new WithdrawalRiskService();