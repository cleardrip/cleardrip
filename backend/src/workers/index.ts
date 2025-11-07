import { logger } from '@/lib/logger';
import { emailWorker } from './notification.worker';

export const initWorkers = () => {
    console.log('Initializing BullMQ workers...');
    
    emailWorker.on('ready', () => {
        console.log('Email worker is ready');
        logger.info('Email worker initialized');
    });

    console.log('All workers initialized');
};

export const closeWorkers = async () => {
    console.log('Closing workers...');
    await emailWorker.close();
    console.log('All workers closed');
};
