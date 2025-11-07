import { FastifyInstance } from 'fastify';
import { getRedisConnection, closeRedisConnection } from '@/lib/redis';

export default async function redisPlugin(app: FastifyInstance) {
    const connection = getRedisConnection();
    
    app.decorate('redis', connection);

    app.addHook('onClose', async () => {
        await closeRedisConnection();
    });
}
