import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/redis";
import { defaultQueueOptions } from "@/config/queue";

export const notificationQueueName = "notificationQueue";

export const notificationQueue = new Queue(notificationQueueName, {
    connection: getRedisConnection(),
    defaultJobOptions: defaultQueueOptions,
});
