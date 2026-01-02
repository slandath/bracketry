import type { Data, GetOption } from '../data/data'
import { create_element_from_Html, get_n_things } from '../utils'
import { get_match_element } from './get_match_element'

export function get_round_element(all_data: Data, round_index: number, get_option: GetOption) {
  const round_element = create_element_from_Html(
    `<div class="round-wrapper"></div>`,
  )

  round_element.setAttribute('round-index', `${round_index}`)

  const last_rnd_index = all_data.rounds.length - 1

  const match_count = 2 ** (last_rnd_index - round_index)

  const matches_elements = get_n_things(match_count, match_order =>
    get_match_element(round_index, match_order, all_data, get_option))

  round_element.append(...matches_elements)

  if (
    round_index === last_rnd_index
    && all_data.matches?.find((m) => {
      return m.roundIndex === last_rnd_index && m.order === 1
    })
  ) {
    round_element.append(
      get_match_element(last_rnd_index, 1, all_data, get_option),
    )
  }

  return round_element
}
