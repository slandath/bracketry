import type { FastifyInstance } from 'fastify'
import process from 'node:process'
import cors from '@fastify/cors'
import Fastify from 'fastify'
import authRoutes from './routes/auth.js'
import healthRoutes from './routes/health.js'
import 'dotenv/config'

function getAllowedOrigins(): string | string[] {
  const corsOrigin = process.env.CORS_ORIGIN

  if (!corsOrigin) {
    return 'http://localhost:5173'
  }

  // Split by comma to support multiple origins
  const origins = corsOrigin.split(',').map(origin => origin.trim())

  // Return single string if only one origin, otherwise return array
  return origins.length === 1 ? origins[0] : origins
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  })
  await app.register(cors, {
    origin: getAllowedOrigins(),
  })
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes, { prefix: '/api/auth' })
  app.get('/', async () => {
    return { hello: 'world' }
  })
  return app
}
