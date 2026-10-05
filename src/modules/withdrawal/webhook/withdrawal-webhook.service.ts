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


                //---------------------------------------
                // DEMO BYPASS: Ignore webhooks for demo users
                //---------------------------------------
                const user = await tx.user.findUnique({
                    where: { id: withdrawal.userId },
                    select: { id: true, isDemo: true },
                });

                if (user?.isDemo) {
                    BusinessLogger.warn(
                        "Ignoring webhook for demo withdrawal",
                        {
                            referenceNumber: payload.referenceNumber,
                            userId: withdrawal.userId,
                        }
                    );

                    return {
                        message: "Demo withdrawal webhook ignored",
                        demo: true,
                    };
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

                        // Optimistic lock: prevent duplicate refunds from concurrent webhooks
                        const updated = await tx.wallet.updateMany({

                            where: {
                                id:
                                    wallet.id,
                                version:
                                    wallet.version
                            },


                            data: {


                                balance:
                                {
                                    increment:
                                        withdrawal.amount
                                },

                                version:
                                {
                                    increment: 1
                                }

                            }

                        });

                        if (updated.count === 0) {
                            throw new Error('Wallet version conflict - refund already processed');
                        }


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