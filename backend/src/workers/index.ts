import { logger } from '@/lib/logger';
import { emailWorker } from './notification.worker';

export const initWorkers = () => {
    logger.info('Initializing BullMQ workers...');
    
    emailWorker.on('ready', () => {
        logger.info('Email worker is ready');
    });

    logger.info('All workers initialized');
};

export const closeWorkers = async () => {
    logger.info ('Closing workers...');
    await emailWorker.close();
    logger.info('All workers closed');
};
