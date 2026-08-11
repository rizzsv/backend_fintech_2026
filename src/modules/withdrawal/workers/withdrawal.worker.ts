import { Worker } from "bullmq";
import { Prisma, withdrawalStatus } from "@prisma/client";
import { prisma } from "../../../shared/config/database";
import { redis } from "../../../shared/config/redis";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { withdrawalRepository } from "../repositories/withdrawal.repository";
import { getWithdrawalProvider } from "../providers/provider.factory";
import { auditService } from "../../audit/services/audit.services";

const withdrawalProvider =
    getWithdrawalProvider();


export const withdrawalWorker =
    new Worker(
        "withdrawal",

        async (job) => {


            const {
                withdrawalId
            } = job.data;



            BusinessLogger.info(
                "Withdrawal worker started",
                {
                    withdrawalId
                }
            );



            /**
             * STEP 1
             * Lock withdrawal state
             */
            const withdrawal =
                await prisma.$transaction(
                    async (tx) => {


                        const withdrawal =
                            await withdrawalRepository.findById(
                                withdrawalId,
                                tx
                            );


                        if (!withdrawal) {

                            throw new Error(
                                "Withdrawal not found"
                            );

                        }



                        /**
                         * Idempotency
                         */
                        if (
                            withdrawal.status ===
                            withdrawalStatus.SUCCESS
                        ) {

                            BusinessLogger.info(
                                "Withdrawal already processed",
                                {
                                    withdrawalId
                                }
                            );


                            return withdrawal;

                        }



                        /**
                         * Move state
                         */
                        await withdrawalRepository.updateStatus(

                            withdrawal.id,

                            withdrawalStatus.PROCESSING,

                            {
                                worker:
                                    "withdrawal-worker"
                            },

                            tx

                        );


                        return withdrawal;

                    }
                );




            /**
             * STEP 2
             * Call external provider
             */
            const result =
                await withdrawalProvider.withdraw({

                    withdrawalId:
                        withdrawal.id,


                    amount:
                        withdrawal.amount.toString(),


                    bankCode:
                        withdrawal.bankCode ?? undefined,


                    accountNumber:
                        withdrawal.accountNumber ?? undefined,


                    accountName:
                        withdrawal.accountName ?? undefined,

                });




            /**
             * STEP 3
             * SUCCESS
             */
            if (result.success) {


                await prisma.$transaction(
                    async (tx) => {


                        await tx.withdrawal.update({

                            where: {
                                id:
                                    withdrawal.id
                            },


                            data: {


                                status:
                                    withdrawalStatus.SUCCESS,


                                providerReference:
                                    result.providerReference,


                                providerResponse:
                                    result.response as Prisma.InputJsonValue,


                                processedAt:
                                    new Date(),

                            }

                        });



                        await auditService.log(

                            {

                                userId:
                                    withdrawal.userId,


                                action:
                                    "WITHDRAWAL_SUCCESS",


                                resource:
                                    "WITHDRAWAL",


                                entityId:
                                    withdrawal.id,


                                metadata: {

                                    providerReference:
                                        result.providerReference,


                                    amount:
                                        withdrawal.amount.toString(),

                                }

                            },

                            tx

                        );


                    }
                );



                return {

                    success: true,

                    withdrawalId:
                        withdrawal.id

                };

            }





            /**
             * STEP 4
             * FAILED
             */
            await prisma.$transaction(
                async (tx) => {


                    await withdrawalRepository.updateStatus(

                        withdrawal.id,

                        withdrawalStatus.FAILED,

                        {

                            reason:
                                result.reason ??
                                "Provider failed"

                        },

                        tx

                    );



                    await auditService.log(

                        {

                            userId:
                                withdrawal.userId,


                            action:
                                "WITHDRAWAL_FAILED",


                            resource:
                                "WITHDRAWAL",


                            entityId:
                                withdrawal.id,


                            metadata: {

                                reason:
                                    result.reason

                            }

                        },

                        tx

                    );


                }
            );



            throw new Error(
                result.reason ??
                "Withdrawal failed"
            );



        },

        {

            connection:
                redis,


            concurrency:
                5,


            removeOnComplete: {
                count: 100
            },

            removeOnFail: {
                count: 500
            }

        }

    );





withdrawalWorker.on(
    "completed",

    (job) => {


        BusinessLogger.info(
            "Withdrawal job completed",
            {
                jobId:
                    job.id
            }
        );

    }

);





withdrawalWorker.on(
    "failed",

    (job, error) => {


        BusinessLogger.error(

            "Withdrawal job failed",

            {

                jobId:
                    job?.id,


                error:
                    error.message

            }

        );

    }

);