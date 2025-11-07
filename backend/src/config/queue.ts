import { DefaultJobOptions } from 'bullmq';

export const defaultQueueOptions: DefaultJobOptions = {
    removeOnComplete: {
        age: 60 * 60,
        count: 100,
    },
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 1000,
    },
    removeOnFail: {
        age: 60 * 60,
    },
}
