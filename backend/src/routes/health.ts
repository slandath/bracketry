import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../index.js'

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    try {
      await db.execute(sql`SELECT 1`)
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      }
    }
    catch {
      return {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      }
    }
  })
}
