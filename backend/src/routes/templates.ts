import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { tournament_templates } from '../db/schema.js'
import { db } from '../index.js'
import { safeValidateBracketData } from '../types/bracket.schema.js'
import { safeValidateTemplateData } from '../types/template.schema.js'
import { getAdminOrThrow, getSessionOrThrow } from '../utils/auth.js'

export default async function templateRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    try {
      await getSessionOrThrow(request)
      const templates = await db.select().from(tournament_templates)
      return reply.status(200).send({
        templates,
      })
    }
    catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      console.error('Error fetching templates:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
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
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      console.error('Error fetching template:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
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
      const [template] = await db.insert(tournament_templates).values({
        id: UUID,
        year: body.year,
        name: body.name,
        data: validatedData,
        is_active: body.is_active ?? false,
      }).returning()
      return reply.status(201).send(template)
    }
    catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      if (error instanceof Error && error.message === 'Forbidden') {
        return reply.status(403).send({ error: 'Forbidden' })
      }
      console.error('Error writing to database:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
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
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      if (error instanceof Error && error.message === 'Forbidden') {
        return reply.status(403).send({ error: 'Forbidden' })
      }
      console.error('Error writing to database:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

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
      if (error instanceof Error && error.message === 'Unauthorized') {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      if (error instanceof Error && error.message === 'Forbidden') {
        return reply.status(403).send({ error: 'Forbidden' })
      }
      console.error('Error writing to database:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
