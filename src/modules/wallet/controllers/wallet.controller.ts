import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';
import { ResponseUtils } from '../../../shared/utils/response.utils';

export class WalletController {
    async getWallet(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result =
                await new WalletService().getWallet(req.user!.id);

            return ResponseUtils.success(
                res,
                result,
                "Wallet fetched successfully"
            )
        } catch (error) {
            next(error);
        }
    }

    async getBalance(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result =
            await new WalletService().getBalance(
                req.user!.id
            );

            return ResponseUtils.success(
                res,
                result,
                "Balance fetched successfully"
            )
        } catch (error) {
            next(error);
        }
    }

    async getLimits(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result =
            await new WalletService().getLimits(
                req.user!.id
            );

            return ResponseUtils.success(
                res,
                result,
                "Limits fetched successfully"
            )
        } catch (error) {
            next(error);
        }
    }

    async getLedger(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;

            const result =
            await new WalletService().getLedger(
                req.user!.id,
                page,
                limit
            );

            return ResponseUtils.success(
                res,
                result,
                "Ledger fetched successfully"
            );
        } catch (error) {
            next(error);
        }
    }
}

export const walletController = 
new WalletController();