import {Worker} from "bullmq"
import {redis} from "../../../shared/config/redis"
import { NotificationJob } from "../types/notification.types"
import { emailService } from "../service/email.service";
import { pushService } from "../service/push.service";


export const notificationWorker = new Worker<NotificationJob>(
    "notification",
    async job => {
        const data = job.data;
        if (data.email) {
            await emailService.send(
                data.email,
                data.title,
                data.message
            )
        }

        await pushService.send(
            data.userId,
            data.title,
            data.message
        )
    },
    {
        connection: redis,
    }
)