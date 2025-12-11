import IORedis, { Redis } from 'ioredis';
import { REDIS_HOST, REDIS_PORT, REDIS_URL } from '@/config/env';
import { logger } from './logger';

class RedisConnection {
    private static instance: Redis | null = null;

    public static createConnection(): Redis {
        logger.info('Creating new Redis connection...');

        // Check if using Upstash or local Redis
        const isUpstash = REDIS_URL?.includes('upstash.io');

        let redisConfig: any;

        if (isUpstash && REDIS_URL) {
            try {
                const url = new URL(REDIS_URL);
                redisConfig = {
                    host: url.hostname,
                    port: parseInt(url.port) || 6379,
                    password: url.password,
                    username: url.username || 'default',
                    tls: {
                        rejectUnauthorized: false
                    },
                    maxRetriesPerRequest: null,
                    enableReadyCheck: false,
                    enableOfflineQueue: true,
                };
            } catch (err) {
                console.error('Failed to parse REDIS_URL:', err);
                throw new Error('Invalid REDIS_URL format');
            }
        } else {
            // Local Redis connection
            redisConfig = {
                host: REDIS_HOST || 'localhost',
                port: REDIS_PORT || 6379,
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                enableOfflineQueue: true,
            };
        }

        const connection = new IORedis(redisConfig);

        connection.on('connect', () => {
            logger.info('Redis connected successfully');
        });

        connection.on('error', (err) => {
            console.error('Redis connection error:', err.message);
        });

        return connection;
    }

    public static getInstance(): Redis {
        if (!RedisConnection.instance) {
            RedisConnection.instance = RedisConnection.createConnection();
        }
        return RedisConnection.instance;
    }

    public static async closeConnection(): Promise<void> {
        if (RedisConnection.instance) {
            await RedisConnection.instance.quit();
            RedisConnection.instance = null;
            logger.info('Redis connection closed and instance cleared');
        }
    }
}

export const getRedisConnection = () => RedisConnection.getInstance();
export const createRedisConnection = () => RedisConnection.createConnection();
export const closeRedisConnection = () => RedisConnection.closeConnection();
