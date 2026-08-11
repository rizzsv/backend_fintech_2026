import {
    Prisma,
    withdrawalStatus,

}
    from "@prisma/client";


import {
    prisma
}
    from "../../../shared/config/database";


import {
    withdrawalRepository
}
    from "../repositories/withdrawal.repository";


import {
    BusinessLogger
}
    from "../../../shared/logger/business-logger";
import { auditService } from "../../audit/services/audit.services";






export class WithdrawalWebhookService {


    async handle(
        payload: any
    ) {

        return prisma.$transaction(
            async (tx) => {


                const withdrawal =
                    await withdrawalRepository.findByReference(
                        payload.referenceNumber,
                        tx
                    );


                if (!withdrawal) {

                    throw new Error(
                        "Withdrawal not found"
                    );

                }



                //--------------------------------
                // Idempotency
                //--------------------------------


                if (
                    withdrawal.status ===
                    withdrawalStatus.SUCCESS
                    ||
                    withdrawal.status ===
                    withdrawalStatus.FAILED
                ) {

                    BusinessLogger.info(
                        "Duplicate withdrawal webhook",
                        {
                            withdrawalId:
                                withdrawal.id
                        }
                    );


                    return;

                }



                //--------------------------------
                // SUCCESS
                //--------------------------------


                if (
                    payload.status === "SUCCESS"
                ) {


                    await tx.withdrawal.update({

                        where: {
                            id:
                                withdrawal.id
                        },


                        data: {


                            status:
                                withdrawalStatus.SUCCESS,


                            providerReference:
                                payload.providerReference,


                            providerResponse:
                                (payload.response as Prisma.InputJsonValue),


                            processedAt:
                                new Date()

                        }

                    });



                    await auditService.log({

                        userId:
                            withdrawal.userId,


                        action:
                            "WITHDRAWAL_SETTLED",


                        resource:
                            "WITHDRAWAL",


                        entityId:
                            withdrawal.id,


                        metadata: {
                            providerReference:
                                payload.providerReference
                        }

                    });



                }



                //--------------------------------
                // FAILED
                //--------------------------------


                if (
                    payload.status === "FAILED"
                ) {


                    await tx.withdrawal.update({

                        where: {
                            id:
                                withdrawal.id
                        },


                        data: {


                            status:
                                withdrawalStatus.FAILED,


                            failedReason:
                                "Provider rejected",


                            providerResponse:
                                payload.response as Prisma.InputJsonValue,


                            processedAt:
                                new Date()

                        }

                    });



                    //--------------------------------
                    // Refund wallet
                    //--------------------------------


                    const wallet =
                        await tx.wallet.findUnique({

                            where: {
                                id:
                                    withdrawal.walletId
                            }

                        });



                    if (wallet) {


                        await tx.wallet.update({

                            where: {
                                id:
                                    wallet.id
                            },


                            data: {


                                balance:
                                {
                                    increment:
                                        withdrawal.amount
                                }

                            }

                        });


                    }



                    await auditService.log({

                        userId:
                            withdrawal.userId,


                        action:
                            "WITHDRAWAL_FAILED_REFUND",


                        resource:
                            "WITHDRAWAL",


                        entityId:
                            withdrawal.id

                    });


                }



            });

    }


}


export const withdrawalWebhookService =
    new WithdrawalWebhookService();