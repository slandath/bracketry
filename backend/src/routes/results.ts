import type { FastifyInstance } from 'fastify'
import type { Match } from '../types/bracket.schema.js'
import { eq } from 'drizzle-orm'
import { tournament_results, tournament_templates } from '../db/schema.js'
import { db } from '../index.js'
import { getAdminOrThrow, getSessionOrThrow } from '../utils/auth.js'
import { NotFoundError } from '../utils/errors.js'

/**
 * GET /api/templates/:id/results - Get tournament results
 * PUT /api/templates/:id/results - Update tournament results
 */
export async function resultsRoutes(server: FastifyInstance): Promise<void> {
  /**
   * GET /api/templates/:id/results
   * Returns the results (matches with scores) for a tournament template
   */
  server.get('/:id/results', async (request, reply) => {
    await getSessionOrThrow(request)
    const { id } = request.params as { id: string }

    const [result] = await db
      .select()
      .from(tournament_results)
      .where(eq(tournament_results.template_id, id))
      .limit(1)

    if (!result) {
      throw new NotFoundError(`Results not found for template ${id}`)
    }

    reply.send({ results: result.matches })
  })

  /**
   * PUT /api/templates/:id/results
   * Updates the tournament results
   * Requires admin role
   */
  server.put('/:id/results', async (request, reply) => {
    const _user = await getAdminOrThrow(request)
    const { id } = request.params as { id: string }
    const { matches } = request.body as { matches: Match[] }

    // Verify template exists
    const [template] = await db
      .select()
      .from(tournament_templates)
      .where(eq(tournament_templates.id, id))
      .limit(1)

    if (!template) {
      throw new NotFoundError(`Template not found: ${id}`)
    }

    // Check if results record exists
    const [existingResults] = await db
      .select()
      .from(tournament_results)
      .where(eq(tournament_results.template_id, id))
      .limit(1)

    let results
    if (existingResults) {
      // Merge updates into existing results
      const updatedMatches = mergeMatchUpdates(
        existingResults.matches as Match[],
        matches,
      )

      const [updatedResults] = await db
        .update(tournament_results)
        .set({
          matches: updatedMatches,
          updated_at: new Date(),
        })
        .where(eq(tournament_results.id, existingResults.id))
        .returning()
      results = updatedResults
    }
    else {
      // Create new results record
      const [newResults] = await db
        .insert(tournament_results)
        .values({
          template_id: id,
          matches,
        })
        .returning()
      results = newResults
    }

    reply.send({
      message: 'Results updated successfully',
      results: results.matches,
    })
  })
}

function mergeMatchUpdates(
  existingMatches: Match[],
  updates: Match[],
): Match[] {
  const updateMap = new Map(updates.map(m => [m.id, m]))

  return existingMatches.map((match) => {
    const update = updateMap.get(match.id)
    if (update) {
      return {
        ...match,
        sides: update.sides,
        matchStatus: update.matchStatus,
        result: update.result,
      }
    }
    return match
  })
}
