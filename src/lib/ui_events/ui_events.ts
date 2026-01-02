import type { Data, Match, Shell } from '../data/data'
import { update_highlight } from './highlight'

/**
 * Extracts a match object corresponding to a clicked element.
 */
function get_match_data_for_element(el: HTMLElement, all_data: Data): Match {
  const round_index = Number(
    el.closest('.round-wrapper')?.getAttribute('round-index'),
  )
  const match_order = Number(
    el.closest('.match-wrapper')?.getAttribute('match-order'),
  )

  const found
    = all_data.matches?.find(
      m => m.roundIndex === round_index && m.order === match_order,
    ) ?? null

  return (
    found || {
      roundIndex: round_index,
      order: match_order,
    }
  )
}

/**
 * Installs click handlers for the bracket UI: navigation, match clicks, side clicks, and highlights.
 */
export function install_ui_events(all_data: Data, get_option: (key: string) => unknown, html_shell: Shell, navigation: {
  handle_click: (el: Element | null) => void
}): { uninstall: () => void } {
  const { the_root_element, matches_positioner } = html_shell

  const handle_root_click = (e: MouseEvent): void => {
    if (e.button !== 0)
      return
    const target = e.target as HTMLElement

    // --- Navigation button ---
    const navButton = target.closest('.navigation-button')
    if (navButton) {
      navigation.handle_click(navButton)
      return
    }

    // --- onMatchClick handler ---
    const onMatchClick = get_option('onMatchClick')
    if (onMatchClick !== null && typeof onMatchClick === 'function') {
      if (target.classList.contains('match-body')) {
        const match_data = get_match_data_for_element(target, all_data);
        (onMatchClick as (m: Match) => void)(match_data)
      }
      return
    }

    // --- onMatchSideClick handler ---
    const onMatchSideClick = get_option('onMatchSideClick')
    if (onMatchSideClick !== null && typeof onMatchSideClick === 'function') {
      const side_wrapper = target.closest('.side-wrapper')
      if (side_wrapper) {
        const match_data = get_match_data_for_element(target, all_data)
        const side_index
          = side_wrapper === target.closest('.side-wrapper:first-child') ? 0 : 1;
        (onMatchSideClick as (m: Match, sideIndex: number) => void)(
          match_data,
          side_index,
        )
      }
      return
    }

    // --- Default: highlight team history ---
    if (target.closest('.matches-scroller')) {
      const disableHighlight
        = get_option('disableHighlight') === true

      const sideElem = target.closest(
        '.side-wrapper[contestant-id]',
      ) as HTMLElement | null

      if (matches_positioner) {
        if (!disableHighlight && sideElem) {
          update_highlight(
            matches_positioner,
            sideElem.getAttribute('contestant-id'),
          )
        }
        else {
          update_highlight(matches_positioner, null)
        }
      }
    }
  }

  the_root_element.addEventListener('click', handle_root_click)

  const uninstall = (): void => {
    the_root_element.removeEventListener('click', handle_root_click)
  }

  return { uninstall }
}
