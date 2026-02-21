import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { brackets, tournament_templates } from '../db/schema.js'
import { db } from '../index.js'
import { safeValidateBracketData } from '../types/bracket.schema.js'
import { getSessionOrThrow } from '../utils/auth.js'

export default async function bracketRoutes(app: FastifyInstance) {
  // All brackets for the user
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
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      console.error('Error fetching brackets:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // This year's bracket for the user

  app.get('/current', async (request, reply) => {
    try {
      const session = await getSessionOrThrow(request)
      const result = await db
        .select()
        .from(brackets)
        .innerJoin(tournament_templates, eq(brackets.template_id, tournament_templates.id))
        .where(
          and(
            eq(brackets.user_id, session.user.id),
            eq(tournament_templates.is_active, true),
          ),
        )
        .limit(1)
      if (result.length === 0) {
        return reply.status(404).send({ error: 'No active bracket found' })
      }
      return reply.status(200).send({
        bracket: result[0].brackets,
      })
    }
    catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      console.error('Error fetching bracket:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // A specific bracket

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
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      console.error('Error fetching bracket:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Update Bracket

  app.put('/:id', async (request, reply) => {
    try {
      const session = await getSessionOrThrow(request)
      const { id } = request.params as { id: string }
      const body = request.body as { template_id: string, is_public?: boolean, data: unknown }
      const updateValues: Record<string, unknown> = {}
      if (body.template_id)
        updateValues.template_id = body.template_id
      if (body.is_public !== undefined)
        updateValues.is_public = body.is_public
      if (body.data) {
        const validationResult = safeValidateBracketData(body.data)
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid bracket data' })
        }
        updateValues.data = validationResult.data
      }
      const [updatedBracket] = await db.update(brackets).set(updateValues).where(and(eq(brackets.id, id), eq(brackets.user_id, session.user.id))).returning()
      if (!updatedBracket) {
        return reply.status(404).send({ error: 'Bracket not found' })
      }
      return reply.status(200).send(updatedBracket)
    }
    catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      console.error('Error updating bracket:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Save a bracket

  app.post('/', async (request, reply) => {
    try {
      const session = await getSessionOrThrow(request)
      const body = request.body as { template_id: string, is_public?: boolean, data: unknown }
      if (!body.template_id) {
        return reply.status(400).send({ error: 'template_id is required' })
      }
      const validationResult = safeValidateBracketData(body.data)
      if (!validationResult.success) {
        return reply.status(400).send({ error: 'Invalid bracket data' })
      }
      const validBracketData = validationResult.data
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
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      console.error('Error writing to database:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Delete bracket

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
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      console.error('Error writing to database:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
