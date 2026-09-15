export class TransactionMapper {

    static toList(items: any[]) {
        return items.map((item) => ({

            id: item.id,

            fromWalletId: item.fromWalletId,

            toWalletId: item.toWalletId,

            toEmail: item.toWallet?.user?.email ?? null,

            amount: item.amount,

            transactionType: item.transactionType,

            status: item.status,

            createdAt: item.createdAt,
        }));
    }

    static toDetail(item: any) {

        return {

            id: item.id,

            referenceNumber: item.referenceNumber,

            amount: item.amount,

            fee: item.fee,

            status: item.status,

            transactionType: item.transactionType,

            description: item.description,

            createdAt: item.createdAt,

            completedAt: item.completedAt,

            fromWallet: item.fromWallet,

            toWallet: item.toWallet,

            ledger: item.ledgerEntries,

            logs: item.logs,
        };
    }
}