import type { FastifyInstance } from 'fastify'
import type { Match } from '../types/bracket.schema.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { tournament_results, tournament_templates } from '../db/schema.js'
import { db } from '../index.js'
import { MatchSchema } from '../types/bracket.schema.js'
import { getAdminOrThrow, getSessionOrThrow } from '../utils/auth.js'
import { NotFoundError } from '../utils/errors.js'

const UpdateResultsSchema = z.object({
  matches: z.array(MatchSchema),
})

/**
 * GET /:id/results - Get tournament results
 * PUT /:id/results - Update tournament results
 */
export async function resultsRoutes(server: FastifyInstance): Promise<void> {
  /**
   * GET /:id/results
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
   * PUT /:id/results
   * Updates the tournament results
   * Requires admin role
   */
  server.put('/:id/results', async (request, reply) => {
    const _user = await getAdminOrThrow(request)
    const { id } = request.params as { id: string }

    const validation = UpdateResultsSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: validation.error.errors })
    }

    const { matches } = validation.data

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

/**
 * Merges match updates into existing match data.
 * Updates are applied by match ID, preserving other match properties.
 * Allows partial updates - only specified fields (sides, matchStatus, result) are overwritten.
 *
 * @param existingMatches - The current matches array from the database
 * @param updates - The matches array with updates from the request
 * @returns A new matches array with updates merged into existing data
 */
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
