import type { Side } from '../data/types'
import {
  is_valid_number,
  remove_whitespace_from_html,
} from '../utils.js'

function is_displayable_score(s: unknown) {
  return is_valid_number(s) || typeof s === 'string'
}

export function get_scores_for_side(
  side: Side | undefined,
  other_side: Side | undefined,
): string {
  const own_score = side?.score
  const opponent_score = other_side?.score

  if (
    !is_displayable_score(own_score)
    && !is_displayable_score(opponent_score)
  ) {
    return ''
  }

  const own_main_score = is_displayable_score(own_score)
    ? own_score
    : ''

  const opponent_main_score = is_displayable_score(opponent_score)
    ? opponent_score
    : ''

  return remove_whitespace_from_html(
    `<div class="single-score-wrapper ${side?.isWinner ? 'winner' : ''}">
            <div class="side-own-single-score">
                <span class="main-score">${own_main_score}</span>
            </div>
            <span class="opponent-single-score">
                <span class="main-score">${opponent_main_score}</span>
            </span>
        </div>`,
  )
}
