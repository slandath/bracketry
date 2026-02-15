import type { ZodError } from 'zod'
import { z } from 'zod'

export const RoundSchema = z.object({
  name: z.string().nullish(),
})

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  seed: z.number(),
  logoUrl: z.string().nullish(),
})

export const SideSchema = z.object({
  teamId: z.string().optional(),
  score: z.number().optional(),
  isWinner: z.boolean().optional(),
})

export const MatchSchema = z.object({
  id: z.string(),
  roundIndex: z.number(),
  order: z.number(),
  sides: z.array(SideSchema),
  matchStatus: z.string().nullable(),
  isLive: z.boolean().optional(),
  result: z.string().nullable(),
  prediction: z.string().nullable(),
})

export const BracketDataSchema = z.object({
  rounds: z.array(RoundSchema),
  teams: z.record(z.string(), TeamSchema),
  matches: z.array(MatchSchema),
})

export function validateBracketData(data: unknown): BracketData {
  return BracketDataSchema.parse(data)
}

export function safeValidateBracketData(data: unknown):
  | { success: true, data: BracketData }
  | { success: false, errors: ZodError } {
  const result = BracketDataSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  else {
    return { success: false, errors: result.error }
  }
}

export type Round = z.infer<typeof RoundSchema>
export type Team = z.infer<typeof TeamSchema>
export type Side = z.infer<typeof SideSchema>
export type Match = z.infer<typeof MatchSchema>
export type BracketData = z.infer<typeof BracketDataSchema>
