export interface MidtransSnapResponse {
    token: string
    redirect_url: string
}

export interface MidtransNotification {
    transaction_time: string;

    transaction_status: string;

    transaction_id: string;

    status_code: string;

    status_message: string;

    signature_key: string;

    payment_type: string;

    order_id: string;

    gross_amount: string;

    fraud_status?: string;

    settlement_time?: string;
}

export interface MidtransStatusResponse {
    transaction_status: string;

    payment_type: string;

    transaction_time: string;

    settlement_time?: string;

    gross_amount: string;

    order_id: string;

    transaction_id: string;
}

export interface MidtransCustomerDetails {
    first_name: string;

    email: string;

    phone: string;
}

export interface MidtransItemDetails {
    id: string;

    price: number;

    quantity: number;

    name: string;
}

export interface MidtransCreateTransactionPayload {
    transaction_details: {
        order_id: string;

        gross_amount: number;
    };

    customer_details: MidtransCustomerDetails;

    item_details: MidtransItemDetails[];

    enabled_payments?: string[];
}