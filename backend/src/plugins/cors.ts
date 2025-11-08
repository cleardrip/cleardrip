import { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { logger } from '@/lib/logger';

export default async function corsPlugin(app: FastifyInstance) {
    await app.register(cors, {
        origin: (origin, callback) => {
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://cleardrip-main.vercel.app',
                'https://www.cleardrip.in',
                // 'https://cleardrip.in'
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn('CORS Rejected Origin:', origin);
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
}
