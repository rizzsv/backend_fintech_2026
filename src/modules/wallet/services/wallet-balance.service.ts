import {Prisma} from '@prisma/client'
import {walletRepository} from '../repositories/wallet.repository'
import { ConcurrentUpdateException } from '../../../shared/exceptions/concurrent-update.exception';

class WalletBalanceService {
    async credit(
        walletId: string,
        amount: Prisma.Decimal | number,
        tx: Prisma.TransactionClient
    ) {
        const wallet = await walletRepository.findById(
            walletId,
            tx
        );
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const result = await walletRepository.updateBalanceWithVersion(
            walletId,
            wallet.version,
            amount as number,
            tx
        );

        if (result.count === 0) {
            throw new ConcurrentUpdateException();
        }

        return wallet.balance
    }
}

export const walletBalanceService = new WalletBalanceService();
