export async function retry<T>(
    callback:()=>Promise<T>,
    retries = 3
):Promise<T>{


let lastError;


for(
    let attempt = 1;
    attempt <= retries;
    attempt++
){

    try {


        return await callback();


    } catch(error:any){


        lastError = error;



        if(
            error.name !== 
            "OptimisticLockError"
        ){

            throw error;

        }



        if(
            attempt === retries
        ){

            throw error;

        }



        await new Promise(
            resolve =>
            setTimeout(
                resolve,
                attempt * 100
            )
        );


    }

}


throw lastError;


}