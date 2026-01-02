import type { Score, Side } from '../data/data'
import {
  get_n_things,
  is_object,
  is_valid_number,
  remove_whitespace_from_html,
} from '../utils.js'

function is_displayable_score(s: unknown) {
  return is_valid_number(s) || typeof s === 'string'
}

export function get_single_score(
  own_score: Score | undefined,
  opponent_score: Score | undefined,
): string {
  if (
    !is_displayable_score(own_score?.mainScore)
    && !is_displayable_score(opponent_score?.mainScore)
  ) {
    return ''
  }

  const own_main_score = is_displayable_score(own_score?.mainScore)
    ? own_score.mainScore
    : ''
  const own_subscore = is_displayable_score(own_score?.subscore)
    ? `<span class="subscore">${own_score.subscore}</span>`
    : ''

  const opponent_main_score = is_displayable_score(opponent_score?.mainScore)
    ? opponent_score.mainScore
    : ''
  const opponent_subscore = is_displayable_score(opponent_score?.subscore)
    ? `<span class="subscore">${opponent_score.subscore}</span>`
    : ''

  return remove_whitespace_from_html(
    `<div class="single-score-wrapper ${own_score?.isWinner ? 'winner' : ''}">
            <div class="side-own-single-score">
                <span class="main-score">${own_main_score}</span>
                ${own_subscore}
            </div>
            <span class="opponent-single-score">
                <span class="main-score">${opponent_main_score}</span>
                ${opponent_subscore}
            </span>
        </div>`,
  )
}

export function get_scores_for_side(
  side: Side | undefined,
  other_side: Side | undefined,
): string {
  const own_score
    = is_object(side) && Array.isArray(side.score) ? side.score : []
  const opponent_score
    = is_object(other_side) && Array.isArray(other_side.score)
      ? other_side.score
      : []
  const max_score_length = Math.max(own_score.length, opponent_score.length)

  // render as much <single-score-wrapper>s as the longest scores of both sides
  const strings = get_n_things(max_score_length, i =>
    get_single_score(own_score[i], opponent_score[i]))
  return strings.join('')
}
