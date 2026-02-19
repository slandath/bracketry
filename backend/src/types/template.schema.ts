import type { ZodError } from 'zod'
import { z } from 'zod'
import { BracketDataSchema, type BracketData } from './bracket.schema.js'

export const TemplateSchema = z.object({
  id: z.string(),
  year: z.number(),
  name: z.string(),
  data: BracketDataSchema,
  is_active: z.boolean(),
})

export const CreateTemplateSchema = z.object({
  year: z.number(),
  name: z.string(),
  data: BracketDataSchema,
  is_active: z.boolean().default(false),
})

export function safeValidateTemplateData(data: unknown):
  | { success: true, data: CreateTemplate }
  | { success: false, errors: ZodError } {
  const result = CreateTemplateSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  else {
    return { success: false, errors: result.error }
  }
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

export type Template = z.infer<typeof TemplateSchema>
export type CreateTemplate = z.infer<typeof CreateTemplateSchema>
