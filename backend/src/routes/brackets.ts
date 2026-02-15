import type { FastifyInstance, FastifyRequest } from 'fastify'
import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { brackets } from '../db/schema.js'
import { db } from '../index.js'
import { validateBracketData } from '../types/bracket.schema.js'
import { auth } from '../utils/auth.js'

async function getSessionOrThrow(request: FastifyRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export default async function bracketRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    try {
      const session = await getSessionOrThrow(request)
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
  app.get('/:id', async (request, reply) => {
    try {
      const session = await getSessionOrThrow(request)
      const { id } = request.params as { id: string }
      const result = await db.select().from(brackets).where(and(eq(brackets.id, id), eq(brackets.user_id, session.user.id)))
      if (result.length === 0) {
        return reply.status(404).send({ error: 'Bracket not found' })
      }
      return reply.status(200).send({
        bracket: result[0],
      })
    }
    catch (error) {
      console.error('Error fetching bracket:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
  app.post('/', async (request, reply) => {
    try {
      const session = await getSessionOrThrow(request)
      const body = request.body as { template_id: string, is_public?: boolean, data: unknown }
      if (!body.template_id) {
        return reply.status(400).send({ error: 'template_id is required' })
      }
      const validBracketData = validateBracketData(body.data)
      if (!validBracketData) {
        return reply.status(400).send({ error: 'Invalid bracket data' })
      }
      const UUID = randomUUID()
      const [newBracket] = await db.insert(brackets).values({
        id: UUID,
        user_id: session.user.id,
        template_id: body.template_id,
        data: validBracketData,
        is_public: body.is_public ?? false,
      }).returning()
      return reply.status(201).send(newBracket)
    }
    catch (error) {
      console.error('Error writing to database:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
  app.delete('/:id', async (request, reply) => {
    try {
      const session = await getSessionOrThrow(request)
      const { id } = request.params as { id: string }
      const [deletedBracket] = await db.delete(brackets).where(and(eq(brackets.id, id), eq(brackets.user_id, session.user.id))).returning()
      if (!deletedBracket) {
        return reply.status(404).send({ error: 'Bracket not found' })
      }
      return reply.status(204).send()
    }
    catch (error) {
      console.error('Error writing to database:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
