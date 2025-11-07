import IORedis, { Redis } from 'ioredis';
import { REDIS_HOST, REDIS_PORT, REDIS_URL } from '@/config/env';

class RedisConnection {
    private static instance: Redis | null = null;

    public static getInstance(): Redis {
        if (!RedisConnection.instance) {
            console.log('Creating Redis connection...');
            
            // Check if using Upstash or local Redis
            const isUpstash = REDIS_URL?.includes('upstash.io');
            const isLocalRedis = REDIS_HOST === 'localhost' || REDIS_HOST === '127.0.0.1';
            
            let redisConfig: any;

            if (isUpstash && REDIS_URL) {
                console.log('Connecting to Upstash Redis');
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
                    console.log(`Upstash - Host: ${url.hostname}, TLS: enabled, Auth: enabled`);
                } catch (err) {
                    console.error('Failed to parse REDIS_URL:', err);
                    throw new Error('Invalid REDIS_URL format');
                }
            } else {
                // Local Redis connection
                console.log('Connecting to Local Redis');
                redisConfig = {
                    host: REDIS_HOST || 'localhost',
                    port: REDIS_PORT || 6379,
                    maxRetriesPerRequest: null,
                    enableReadyCheck: false,
                    enableOfflineQueue: true,
                };
                console.log(`Local - Host: ${REDIS_HOST || 'localhost'}, Port: ${REDIS_PORT || 6379}`);
            }

            RedisConnection.instance = new IORedis(redisConfig);

            RedisConnection.instance.on('connect', () => {
                console.log('Redis connected successfully');
            });

            RedisConnection.instance.on('ready', () => {
                console.log('Redis is ready to accept commands');
            });

            RedisConnection.instance.on('error', (err) => {
                console.error('Redis connection error:', err.message);
                
                if (err.message.includes('NOAUTH')) {
                    console.error('Check REDIS_URL password is correct');
                }
                if (err.message.includes('ETIMEDOUT')) {
                    console.error('Check Redis server is running and accessible');
                }
            });

            RedisConnection.instance.on('close', () => {
                console.log('Redis connection closed');
            });
        }

        return RedisConnection.instance;
    }

    public static async closeConnection(): Promise<void> {
        if (RedisConnection.instance) {
            await RedisConnection.instance.quit();
            RedisConnection.instance = null;
            console.log('Redis connection closed and instance cleared');
        }
    }
}

export const getRedisConnection = () => RedisConnection.getInstance();
export const closeRedisConnection = () => RedisConnection.closeConnection();
