import type { FlattenedMeta } from '../data/types'
import { OPTIONS } from './options_meta'

export function get_options_flattened_meta(): FlattenedMeta {
  const flattened: FlattenedMeta = {}
  Object.values(OPTIONS).forEach(options_of_kind =>
    Object.assign(flattened, options_of_kind),
  )
  return flattened
}

export function get_default_options(): Record<string, unknown> {
  const default_options: Record<string, unknown> = {}
  Object.entries(get_options_flattened_meta()).forEach(
    ([option_name, { default_value }]) => {
      default_options[option_name] = default_value
    },
  )
  return default_options
}

export function get_option_meta(option_name: string) {
  return get_options_flattened_meta()[option_name]
}

export function get_all_options_names() {
  return Object.keys(get_options_flattened_meta())
}
