import type { GetOption, Shell } from '../data/types'

function update_position(
  shell: Shell,
  get_option: GetOption,
  offsetY: number,
): void {
  if (!shell.scrollbar || !shell.matches_positioner)
    return
  if (get_option('showScrollbar') !== true)
    return
  shell.scrollbar.style.top = `${(offsetY / shell.matches_positioner.clientHeight) * 100}%`
}

function update_position_with_transition(
  shell: Shell,
  get_option: GetOption,
  offsetY: number,
): void {
  if (!shell.scrollbar)
    return
  const scrollbar = shell.scrollbar
  scrollbar.classList.add('animated')
  update_position(shell, get_option, offsetY)
  const deanimate = (): void => {
    scrollbar.classList.remove('animated')
    scrollbar.removeEventListener('transitionend', deanimate)
  }
  scrollbar.addEventListener('transitionend', deanimate)
}

function update_height(shell: Shell): void {
  if (
    !shell.scrollbar
    || !shell.matches_scroller
    || !shell.matches_positioner
  ) {
    return
  }
  shell.scrollbar.style.height = `${
    (shell.matches_scroller.clientHeight
      / shell.matches_positioner.clientHeight)
    * 100
  }%`
}

function full_update(
  shell: Shell,
  get_option: GetOption,
  offsetY: number,
): void {
  if (
    !shell.scrollbar
    || !shell.matches_scroller
    || !shell.matches_positioner
  ) {
    return
  }
  if (get_option('showScrollbar') !== true)
    return
  const content_is_higher
    = shell.matches_positioner.clientHeight > shell.matches_scroller.clientHeight
  shell.scrollbar.style.visibility = content_is_higher ? 'visible' : 'hidden'
  update_position(shell, get_option, offsetY)
  update_height(shell)
}

export const scrollbar_functions = {
  update_position,
  update_position_with_transition,
  full_update,
}
