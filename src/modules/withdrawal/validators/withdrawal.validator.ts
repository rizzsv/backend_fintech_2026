import { z } from "zod";
import { WithdrawalMethod } from "@prisma/client";


export const createWithdrawalSchema =
    z.object({

        amount:
            z.number()
            .positive(),

        method:
            z.nativeEnum(
                WithdrawalMethod
            ),


        bankCode:
            z.string()
            .min(3)
            .optional(),


        accountNumber:
            z.string()
            .min(5)
            .optional(),


        accountName:
            z.string()
            .min(3)
            .optional(),

    });