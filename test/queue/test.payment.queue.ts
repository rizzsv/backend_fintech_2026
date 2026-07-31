import { paymentJob } from "../../src/modules/payment/queue/payment.job";

async function main() {

    await paymentJob.addReconciliationJob(

        "PAY-123456"

    );

    console.log("Success");

}

main();