import {MidtransNotification} from './midtrans.types';

export interface PaymentWebHookJob {
    notification: MidtransNotification;
}