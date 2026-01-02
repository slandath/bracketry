import type { GetOption, Shell } from '../data/data'

export function get_visible_rounds_count(shell: Shell, get_option: GetOption) {
  const rounds = shell.matches_positioner.querySelectorAll('.round-wrapper')

  const vrc = get_option('visibleRoundsCount') as number | undefined

  if (vrc !== undefined && vrc >= 1) {
    // --> not auto
    return Math.min(rounds.length, vrc)
  }
  else {
    if (!shell.matches_scroller)
      return 0
    const vrc_float
      = shell.matches_scroller.getBoundingClientRect().width
        / rounds[0].getBoundingClientRect().width
    if (Number.isNaN(vrc_float))
      return 0
    if (get_option('displayWholeRounds') as boolean) {
      return Math.max(
        1, // if not enough width for 1 full round, make it shrink
        Math.floor(vrc_float),
      )
    }
    return vrc_float
  }
}

export function is_last_round_fully_visible(
  shell: Shell,
  base_index_value: number,
  get_option: GetOption,
) {
  const rounds = shell.matches_positioner.querySelectorAll('.round-wrapper')
  return (
    base_index_value + get_visible_rounds_count(shell, get_option) * 1.01
    >= rounds.length
  )
}

export function get_max_base_index(shell: Shell, get_option: GetOption) {
  const rounds = shell.matches_positioner.querySelectorAll('.round-wrapper')
  return (
    rounds.length
    - Math.floor(get_visible_rounds_count(shell, get_option) * 1.01)
  )
}
