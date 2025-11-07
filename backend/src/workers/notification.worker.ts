import { Job, Worker } from "bullmq";
import { logger } from "@/lib/logger";
import { redisConnection } from "@/config/queue";
import { emailQueueName } from "@/queues/email.queue";
import { sendEmail } from "@/lib/email/sendEmail";
import { prisma } from "@/lib/prisma";

export const notificationWorkerName = "emailWorker";

export const notificationWorker = new Worker(
    emailQueueName,
    async (job: Job) => {
        console.log(`\n📧 Processing email job: ${job.id}`);
        logger.info(`Processing email job: ${job.id}`);
        
        try {
            const { to, subject, message, html } = job.data;
            
            if (!to || !subject || !message) {
                throw new Error("Invalid job data: to, subject, and message are required");
            }

            // Send the email
            const result = await sendEmail(to, subject, message, html || message);
            
            if (result.error) {
                throw new Error(`Email sending failed: ${result.error}`);
            }

            // Update notification status in DB
            if (job.data.notificationId) {
                await prisma.notification.update({
                    where: { id: job.data.notificationId },
                    data: { 
                        status: "SENT",
                        sentAt: new Date()
                    }
                });
            }

            console.log(`Email sent successfully to ${to}`);
            logger.info(`Email sent successfully to ${to}`);
            
            return { success: true, message: "Email sent successfully" };
        } catch (error: any) {
            console.error(`Error processing email job:`, error);
            logger.error(`Error processing email job: ${error.message}`);
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

// Worker event listeners for monitoring
notificationWorker.on('completed', (job) => {
    console.log(` Job ${job.id} completed successfully`);
});

notificationWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

notificationWorker.on('error', (err) => {
    // console.error('Worker error:', err);
});

notificationWorker.on('stalled', (jobId) => {
    console.warn(`Job ${jobId} has stalled`);
});
