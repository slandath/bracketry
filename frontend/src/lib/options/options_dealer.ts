import type { FlattenedMeta } from '../data/types.js'
import { is_object } from '../utils.js'
import { get_options_flattened_meta } from './options_meta_getter'
import { is_valid_option } from './validate_user_options.js'

function _get_final_value(
  name: string,
  user_options: Record<string, unknown>,
  flattened_meta: FlattenedMeta,
): unknown {
  const option_meta = flattened_meta[name]

  if (option_meta === undefined) {
    console.warn('Impossible option name passed to get_final_value: ', name)
    return
  }

  const user_value = user_options[name]

  const value
    = user_value !== undefined ? user_value : option_meta.default_value

  if (
    (option_meta.type === 'number' || option_meta.type === 'pixels')
    && typeof option_meta.min_value === 'number'
  ) {
    return Math.max(value as number, option_meta.min_value)
  }
  else {
    return value
  }
}

export function create_options_dealer() {
  const user_options: Record<string, unknown> = {}
  const flattened_meta = get_options_flattened_meta() as FlattenedMeta

  return {
    try_merge_options: (
      new_user_options: Record<string, unknown> | undefined,
    ): void => {
      if (new_user_options === undefined)
        return

      if (!is_object(new_user_options)) {
        console.warn(
          'options must be an object, instead got',
          typeof new_user_options,
        )
        return
      }

      Object.entries(new_user_options).forEach(([name, value]) => {
        const option_meta = flattened_meta[name]
        if (is_valid_option(name, value, option_meta)) {
          user_options[name] = value
        }
      })
    },

    get_final_value: (name: string): unknown =>
      _get_final_value(name, user_options, flattened_meta),

    get_user_options: () => user_options,

    get_all_final_options: () => {
      const result: Record<string, unknown> = {}
      Object.keys(flattened_meta).forEach((option_name) => {
        result[option_name] = _get_final_value(
          option_name,
          user_options,
          flattened_meta,
        )
      })
      return result
    },
  }
}
