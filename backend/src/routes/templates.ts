import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { tournament_results, tournament_templates } from '../db/schema.js'
import { db } from '../index.js'
import { safeValidateBracketData } from '../types/bracket.schema.js'
import { safeValidateTemplateData } from '../types/template.schema.js'
import { getAdminOrThrow, getSessionOrThrow } from '../utils/auth.js'
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js'

export default async function templateRoutes(app: FastifyInstance) {
  /**
   * GET / - List all tournament templates
   * Requires authentication (session)
   */
  app.get('/', async (request, reply) => {
    try {
      await getSessionOrThrow(request)
      const templates = await db.select().from(tournament_templates)
      return reply.status(200).send({
        templates,
      })
    }
    catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }
      request.log.error(error)
      return reply.internalServerError('Something went wrong')
    }
  })
  /**
   * GET /active - Get the currently active tournament template
   * Requires authentication (session)
   */
  app.get('/active', async (request, reply) => {
    try {
      await getSessionOrThrow(request)
      const result = await db.select().from(tournament_templates).where(eq(tournament_templates.is_active, true))
      if (result.length === 0) {
        return reply.status(404).send({ error: 'no active templates' })
      }
      return reply.status(200).send({
        template: result[0],
      })
    }
    catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }
      request.log.error(error)
      return reply.internalServerError('Something went wrong')
    }
  })

  /**
   * PATCH /:id/activate - Set a template as active (for a given year)
   * Deactivates all other templates for the same year
   * Requires admin role
   */
  app.patch('/:id/activate', async (request, reply) => {
    try {
      await getAdminOrThrow(request)
      const { id } = request.params as { id: string }
      const [template] = await db.select().from(tournament_templates).where(eq(tournament_templates.id, id))
      if (!template) {
        return reply.status(404).send({ error: 'Template not found' })
      }
      const year = template.year
      await db.transaction(async (tx) => {
        await tx.update(tournament_templates).set({ is_active: false }).where(eq(tournament_templates.year, year))
        await tx.update(tournament_templates).set({ is_active: true }).where(eq(tournament_templates.id, id))
      })
      return reply.status(200).send({ message: 'Template activated' })
    }
    catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }
      request.log.error(error)
      return reply.internalServerError('Something went wrong')
    }
  })

  /**
   * POST / - Create a new tournament template
   * Requires admin role
   */
  app.post('/', async (request, reply) => {
    try {
      await getAdminOrThrow(request)
      const body = request.body as { year: number, name: string, is_active?: boolean, data: unknown }
      if (body.year === undefined) {
        return reply.status(400).send({ error: 'year is required' })
      }
      if (!body.name) {
        return reply.status(400).send({ error: 'name is required' })
      }
      const validationResult = safeValidateTemplateData(body)
      if (!validationResult.success) {
        return reply.status(400).send({ error: 'Invalid template data' })
      }
      const validatedData = validationResult.data
      const UUID = randomUUID()

      // Create skeleton matches from template data (remove scores/winners)
      const skeletonMatches = validatedData.data.matches?.map((match: { id: string, roundIndex: number, order: number, sides: Array<{ teamId?: string }> }) => ({
        id: match.id,
        roundIndex: match.roundIndex,
        order: match.order,
        sides: match.sides?.map(side => ({ teamId: side.teamId })) || [],
        matchStatus: 'Scheduled',
        isLive: false,
        prediction: null,
        result: null,
      })) || []

      // Use transaction to create both template and results atomically
      const [template] = await db.transaction(async (tx) => {
        const [newTemplate] = await tx.insert(tournament_templates).values({
          id: UUID,
          year: body.year,
          name: body.name,
          data: validatedData.data,
          is_active: body.is_active ?? false,
        }).returning()

        await tx.insert(tournament_results).values({
          template_id: UUID,
          matches: skeletonMatches,
        })

        return [newTemplate]
      })

      return reply.status(201).send(template)
    }
    catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }
      request.log.error(error)
      return reply.internalServerError('Something went wrong')
    }
  })
  /**
   * PUT /:id - Update an existing tournament template
   * Requires admin role
   */
  app.put('/:id', async (request, reply) => {
    try {
      await getAdminOrThrow(request)
      const { id } = request.params as { id: string }
      const body = request.body as {
        year?: number
        name?: string
        is_active?: boolean
        data?: unknown
      }
      let validatedData
      if (body.data !== undefined) {
        const validationResult = safeValidateBracketData(body.data)
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Invalid template data',
          })
        }
        validatedData = validationResult.data
      }
      const [updatedTemplate] = await db.update(tournament_templates).set({
        ...(body.year !== undefined && { year: body.year }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        ...(validatedData !== undefined && { data: validatedData }),
      }).where(eq(tournament_templates.id, id)).returning()
      if (!updatedTemplate) {
        return reply.status(404).send({ error: 'Template could not be updated' })
      }
      return reply.status(204).send()
    }
    catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }
      request.log.error(error)
      return reply.internalServerError('Something went wrong')
    }
  })

  /**
   * DELETE /:id - Delete a tournament template
   * Requires admin role
   */
  app.delete('/:id', async (request, reply) => {
    try {
      await getAdminOrThrow(request)
      const { id } = request.params as { id: string }
      const [deletedTemplate] = await db.delete(tournament_templates).where(eq(tournament_templates.id, id)).returning()
      if (!deletedTemplate) {
        return reply.status(404).send({ error: 'Template not found' })
      }
      return reply.status(204).send()
    }
    catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }
      request.log.error(error)
      return reply.internalServerError('Something went wrong')
    }
  })
}
