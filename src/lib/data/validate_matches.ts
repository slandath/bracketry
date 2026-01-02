import type { Match, Side, Team } from './data.js'
import { is_object, is_valid_number } from '../utils.js'

export function validate_matches(matches: Match[], teams: { [id: string]: Team }) {
  const errors = []

  if (matches !== undefined && !Array.isArray(matches)) {
    errors.push({
      is_critical: true,
      message: `data.matches must be an array:`,
      data: matches,
    })
  }

  if (matches && matches.length) {
    matches.forEach((match) => {
      if (!is_object(match)) {
        errors.push({
          is_critical: true,
          message: `Match must be an object:`,
          data: match,
        })
      }

      if (!is_valid_number(match.roundIndex)) {
        errors.push({
          is_critical: false,
          message: `Match must contain a numeric "roundIndex" prop:`,
          data: match,
        })
      }
      if (!is_valid_number(match.order)) {
        errors.push({
          is_critical: false,
          message: `Match must contain a numeric "order" prop:`,
          data: match,
        })
      }

      if (match.sides !== undefined && !Array.isArray(match.sides)) {
        errors.push({
          is_critical: true,
          message: `Match.sides is required and must be an array`,
          data: match,
        })
      }

      if (Array.isArray(match.sides)) {
        match.sides.forEach((side: Side) => {
          if (!is_object(side)) {
            errors.push({
              is_critical: true,
              message: `Match's side must be an object`,
              data: match,
            })
            return
          }

          if (side.teamId !== undefined && typeof side.teamId !== 'string') {
            errors.push({
              is_critical: true,
              message: `If you provide side.teamId, it must be a string`,
              data: side,
            })
          }

          if (
            typeof side.teamId === 'string'
            && !Object.keys(teams || {}).includes(side.teamId)
          ) {
            errors.push({
              is_critical: false,
              message: 'No team data found for this side.teamId:',
              data: side,
            })
          }

          if (
            side.isWinner !== undefined
            && typeof side.isWinner !== 'boolean'
          ) {
            errors.push({
              is_critical: false,
              message: 'If you provide side.isWinner, it must be a boolean',
              data: side,
            })
          }
        })
      }
    })
  }
  return errors
}
