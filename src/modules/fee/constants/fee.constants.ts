/**
 * Only the transfer fee is consumed - `feeService.calculateTranferFee` is the
 * single caller. The withdrawal fee lives in
 * `modules/withdrawal/constants/withdrawal.constants.ts`, which is what the
 * withdrawal service actually charges.
 */
export const FeeConfig = {
    TRANFER: {
        type: 'FIXED',
        amount: 2500,
    },
} as const
