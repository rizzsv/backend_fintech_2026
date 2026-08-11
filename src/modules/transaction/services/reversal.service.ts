export class ReversalService {
    async reverse(
        transactionId: string,
    ) {
        throw new Error(
            "ReversalService.reverse is not implemented yet. Please implement this method to handle the reversal of a transaction with ID: " + transactionId
        )
    }
}

export const reversalService = new ReversalService();