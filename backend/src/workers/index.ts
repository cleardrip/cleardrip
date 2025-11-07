import { notificationWorker } from './notification.worker';
import { logger } from '@/lib/logger';

export const initWorkers = () => {
    console.log('Initializing BullMQ workers...');
    
    // Email Worker Events
    notificationWorker.on('ready', () => {
        console.log('Email worker is ready');
        logger.info('Email worker initialized');
    });

    notificationWorker.on('error', (err) => {
        logger.error('Email worker error:', err);
    });

    notificationWorker.on('completed', (job) => {
        console.log(`Email job ${job.id} completed`);
    });

    notificationWorker.on('failed', (job, err) => {
        console.error(`Email job ${job?.id} failed:`, err.message);
    });

    console.log('All workers initialized');
};

export const closeWorkers = async () => {
    console.log('Closing workers...');
    await notificationWorker.close();
    console.log('All workers closed');
};
