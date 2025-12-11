import { Job, Worker } from "bullmq";
import { logger } from "@/lib/logger";
import { createRedisConnection } from "@/lib/redis";
import { emailQueueName } from "@/queues/email.queue";
import { sendEmail } from "@/lib/email/sendEmail";
import { prisma } from "@/lib/prisma";

export const emailWorker = new Worker(
    emailQueueName,
    async (job: Job) => {
        logger.info(`Processing email job: ${job.id}`);

        try {
            const { to, subject, message, html } = job.data;

            if (!to || !subject || !message) {
                throw new Error("Invalid job data: to, subject, and message are required");
            }

            const result = await sendEmail(to, subject, message, html || message);

            if (result.error) {
                throw new Error(`Email sending failed: ${result.error}`);
            }

            if (job.data.notificationId) {
                await prisma.notification.update({
                    where: { id: job.data.notificationId },
                    data: {
                        status: "SENT",
                        sentAt: new Date()
                    }
                });
            }

            logger.info(`Email sent successfully to ${to}`);
            return { success: true, message: "Email sent successfully" };
        } catch (error: any) {
            logger.error(`Error processing email job:`, error);
            throw error;
        }
    },
    {
        connection: createRedisConnection(),
        concurrency: 5,
    }
);

emailWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
});

emailWorker.on('error', (err) => {
    logger.error(`Worker error: ${err.message}`);
    console.error('Detailed Worker Error:', err);
})