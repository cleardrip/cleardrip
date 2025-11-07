import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/redis";
import { defaultQueueOptions } from "@/config/queue";

export const emailQueueName = "emailQueue";

export const emailQueue = new Queue(emailQueueName, {
    connection: getRedisConnection(),
    defaultJobOptions: defaultQueueOptions,
});
