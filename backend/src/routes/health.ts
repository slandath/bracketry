import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../index.js'

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    try {
      await db.execute(sql`SELECT 1`)
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      }
    }
    catch {
      return reply.status(503).send({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      })
    }
  })
}
