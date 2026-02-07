import type { FastifyInstance } from 'fastify'
import process from 'node:process'
import cors from '@fastify/cors'
import Fastify from 'fastify'
import healthRoutes from './routes/health.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  })
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  })
  await app.register(healthRoutes, { prefix: '/health' })
  app.get('/', async () => {
    return { hello: 'world' }
  })
  return app
}
