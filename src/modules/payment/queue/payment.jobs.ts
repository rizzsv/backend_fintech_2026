export const PaymentJobs = {
    RECONCILE : "payment: reconcile",
    RECONCILE_ALL : "payment: reconcile-all",
    EXPIRE : "payment: expire",
    CANCEL : "payment: cancel",
    WEBHOOK_RETRY : "payment: webhook-retry",
} as const 

export type PaymentJobName = typeof PaymentJobs[keyof typeof PaymentJobs];