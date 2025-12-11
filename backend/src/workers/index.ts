import { logger } from '@/lib/logger';
// import { emailWorker } from './notification.worker';

export const initWorkers = () => {
    // emailWorker.on('completed', (job) => {
    //     logger.info(`Email job ${job.id} completed`);
    // });

    // emailWorker.on('failed', (job, err) => {
    //     logger.error(`Email job ${job?.id} failed: ${err.message}`);
    // });

    // logger.info('Email worker started');
    logger.info('Workers initialized');
};

export const closeWorkers = async () => {
    // await emailWorker.close();
    logger.info('Workers closed');
};
