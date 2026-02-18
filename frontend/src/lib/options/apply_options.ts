import type { GetOption, OptionsDealer } from '../data/types'
import { is_object } from '../utils'
import { get_options_flattened_meta } from './options_meta_getter'

const feature_classes: Record<string, (o: Record<string, unknown>) => boolean>
  = {
    'with-scroll-buttons-over-matches': o =>
      o.scrollButtonsPosition === 'overMatches',
    'with-hidden-nav-buttons': o => o.navButtonsPosition === 'hidden',
    'with-gutter-nav-buttons': o => o.navButtonsPosition === 'gutters',
    'with-nav-buttons-over_matches': o =>
      o.navButtonsPosition === 'overMatches',
    'with-nav-buttons-before-titles': o =>
      o.navButtonsPosition === 'beforeTitles',
    'with-nav-buttons-over-titles': o =>
      o.navButtonsPosition === 'overTitles',
    'with-onMatchClick': o => typeof o.onMatchClick === 'function',
    'with-classical-layout': o => o.useClassicalLayout === true,
    'with-clickable-sides': o =>
      typeof o.onMatchSideClick === 'function' || o.disableHighlight !== true,
    'with-vertical-scroll-buttons': o =>
      o.verticalScrollMode === 'buttons' || o.verticalScrollMode === 'mixed',
    'with-native-scroll': o => o.verticalScrollMode === 'native',
    'with-visible-scrollbar': o => o.showScrollbar === true,
  }

function update_the_DOM(
  the_root_element: HTMLElement,
  get_option: GetOption,
): void {
  (
    the_root_element.querySelector('.navigation-button.left') as HTMLElement
  ).innerHTML = get_option('leftNavButtonHTML') as string;
  (
    the_root_element.querySelector('.navigation-button.right') as HTMLElement
  ).innerHTML = get_option('rightNavButtonHTML') as string;

  (the_root_element.querySelector('.button-up') as HTMLElement).innerHTML
    = get_option('scrollUpButtonHTML') as string;
  (the_root_element.querySelector('.button-down') as HTMLElement).innerHTML
    = get_option('scrollDownButtonHTML') as string
}

export function apply_options(
  new_options: Record<string, unknown>,
  options_dealer: OptionsDealer,
  { the_root_element }: { the_root_element: HTMLElement },
): void {
  const get_option = options_dealer.get_final_value

  options_dealer.try_merge_options(new_options)

  update_the_DOM(the_root_element, get_option)

  // ******* set primitive options as CSS variables
  const flattened_meta = get_options_flattened_meta()
  const final_options = options_dealer.get_all_final_options()

  Object.entries(final_options).forEach(([n, v]) => {
    const meta = (flattened_meta as Record<string, { type: string }>)[
      n as string
    ] as { type: string } | undefined
    if (meta && ['pixels', 'string'].includes(meta.type)) {
      let value = v
      if (meta.type === 'pixels') {
        value = `${Number.parseInt(value as string)}px`
      }
      the_root_element.style.setProperty(`--${n}`, value as string)
    }
  })

  // ******* set feature classes on root element
  Object.entries(feature_classes).forEach(([className, condition]) => {
    if (condition(final_options)) {
      the_root_element.classList.add(className)
    }
    else {
      the_root_element.classList.remove(className)
    }
  })
}

export function filter_updatable_options(
  options: Record<string, unknown>,
): Record<string, unknown> {
  const meta = get_options_flattened_meta()
  const updatable_options: Record<string, unknown> = {}

  if (is_object(options)) {
    Object.entries(options).forEach(([n, v]) => {
      const metaEntry = (meta as Record<string, { type: string }>)[
        n as string
      ] as { type: string } | undefined
      if (
        metaEntry?.type === 'function_or_null'
        || n === 'verticalScrollMode'
      ) {
        console.warn(`${n} option can't be updated via applyNewOptions`)
      }
      else {
        updatable_options[n] = v
      }
    })
  }

  return updatable_options
}
