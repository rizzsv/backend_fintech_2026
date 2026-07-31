import { redis } from "../config/redis";
import crypto from "crypto";


export class RedisLockService {


    private prefix =
        "lock:";



    async acquire(
        key: string,
        ttl: number = 30
    ): Promise<string | null> {


        const lockKey =
            this.prefix + key;


        const token =
            crypto
                .randomUUID();



        const result =
            await redis.set(

                lockKey,

                token,

                "EX",
                ttl,

                "NX"
            );



        if (result !== "OK") {

            return null;

        }



        return token;

    }




    async release(

        key: string,

        token: string

    ) {


        const lockKey =
            this.prefix + key;



        const current =
            await redis.get(
                lockKey
            );



        if (current !== token) {

            return;

        }



        await redis.del(
            lockKey
        );


    }

    async executeWithLock<T>(

        key: string,

        callback: () => Promise<T>,

        ttl: number = 30

    ): Promise<T> {



        const token =
            await this.acquire(
                key,
                ttl
            );



        if (!token) {

            throw new Error(
                "Resource is being processed"
            );

        }



        try {


            return await callback();


        }

        finally {


            await this.release(
                key,
                token
            );


        }


    }

}





export const redisLock =
    new RedisLockService();