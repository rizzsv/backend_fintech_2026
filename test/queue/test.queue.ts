import {
    paymentQueue,
} from "../../src/shared/queue/payment.queue";

async function main() {

    await paymentQueue.add(

        "hello",

        {

            name: "Fintech",

        }

    );

    console.log(
        "Queue Success"
    );

}

main();