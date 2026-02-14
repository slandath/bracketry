import type { FastifyInstance } from 'fastify'
import process from 'node:process'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import healthRoutes from './routes/health.js'
import { auth } from './utils/auth.js'
import 'dotenv/config'

function getAllowedOrigins(): string | string[] {
  const corsOrigin = process.env.CORS_ORIGIN

  if (!corsOrigin) {
    return 'http://localhost:5173'
  }

  const origins = corsOrigin.split(',').map(origin => origin.trim())

  return origins.length === 1 ? origins[0] : origins
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  })
  await app.register(cors, {
    origin: getAllowedOrigins(),
    credentials: true,
  })

  await app.register(async (scoped) => {
    await scoped.register(rateLimit, {
      global: false,
      max: 10,
      timeWindow: '1 minute',
    })
    // Use Better-Auth's built-in handler
    scoped.all('/*', async (request, reply) => {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`)
        const body = request.body && typeof request.body === 'object'
          ? JSON.stringify(request.body)
          : undefined

        const req = new Request(url, {
          method: request.method,
          headers: request.headers as HeadersInit,
          body,
        })

        const response = await auth.handler(req)

        reply.status(response.status)
        response.headers.forEach((value, key) => {
          reply.header(key, value)
        })

        const responseBody = await response.text()
        return responseBody
      }
      catch (error) {
        request.log.error('Auth handler error:', error)
        reply.status(500).send({ error: 'Authentication failed' })
      }
    })
  }, { prefix: '/api/auth' })

  await app.register(healthRoutes, { prefix: '/health' })

  app.get('/', async () => {
    return { hello: 'world' }
  })
  return app
}
