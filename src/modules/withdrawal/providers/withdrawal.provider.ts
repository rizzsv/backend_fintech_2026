export interface WithdrawalProvider {


    withdraw(
        payload:{
            withdrawalId:string;
            amount:string;
            bankCode?:string;
            accountNumber?:string;
            accountName?:string;
        }
    ):Promise<{

        success:boolean;

        providerReference?:string;

        response?:unknown;

        reason?:string;

    }>;


    checkStatus(
        providerReference:string
    ):Promise<{

        success:boolean;

        status:
        | "SUCCESS"
        | "FAILED"
        | "PENDING";


        response?:unknown;

    }>;


}



export interface WithdrawalPayload {


    withdrawalId:string;


    amount:string;


    bankCode?:string;


    accountNumber?:string;


    accountName?:string;


}



export interface WithdrawalResult {


    success:boolean;


    providerReference?:string;


    status?:
        | "SUCCESS"
        | "FAILED"
        | "PENDING";


    response?:unknown;


    reason?:string;


}