export interface CreatePaymentDTO {
    amount: number;
    paymentMethod: string;
}

export interface PaymentResponse {
    paymentId: string;
    referenceNumber: string;

    provider: string;

    paymentMethod: string;

    amount: number;

    status: string;

    paymentUrl?: string;

    qrUrl?: string;

    snapToken?: string;

    expiredAt: Date;
}

export interface PaymentStatusResponse {
    paymentId: string;

    status: string;

    paidAt?: Date | null;
}