import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { brackets } from '../db/schema.js'
import { db } from '../index.js'
import { auth } from '../utils/auth.js'

export default async function bracketRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      if (!session) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      const userBrackets = await db.select().from(brackets).where(eq(brackets.user_id, session.user.id))
      return reply.status(200).send({
        brackets: userBrackets,
        message: userBrackets.length === 0 ? 'No brackets found for user' : undefined,
      })
    }
    catch (error) {
      console.error('Error fetching brackets:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
