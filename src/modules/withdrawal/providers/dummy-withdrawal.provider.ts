import {
    WithdrawalProvider,
    WithdrawalPayload,
    WithdrawalResult
}
from "./withdrawal.provider";


export class DummyWithdrawalProvider
implements WithdrawalProvider {



    async withdraw(
        payload: WithdrawalPayload
    ): Promise<WithdrawalResult>{


        console.log(
            "[DUMMY BANK WITHDRAW]",
            payload
        );



        /**
         * simulasi bank delay
         */

        await new Promise(
            resolve =>
            setTimeout(resolve,1000)
        );



        return {


            success:true,


            status:"SUCCESS",


            providerReference:
                `DUMMY-${Date.now()}`,



            response:{


                message:
                "Dummy withdrawal success"


            }


        };

    }



    async checkStatus(
        providerReference:string
    ): Promise<WithdrawalResult>{


        return {


            success:true,


            status:"SUCCESS",


            providerReference,


            response:{


                message:
                "Already completed"


            }


        };


    }


}