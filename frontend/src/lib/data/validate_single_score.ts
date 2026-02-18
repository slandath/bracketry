import type { Side } from './types.js'
import { is_valid_number } from '../utils.js'

export function validate_single_score(score: unknown, side: Side) {
  const errors = []

  if (score !== undefined && score !== null && !is_valid_number(score)) {
    errors.push({
      is_critical: false,
      message: 'Score must be a number or null/undefined',
      data: side,
    })
  }

  return errors
}
