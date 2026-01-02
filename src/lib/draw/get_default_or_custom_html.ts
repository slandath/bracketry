export function get_default_or_custom_html(default_getter: () => unknown, user_getter: ((...args: unknown[]) => unknown) | null | undefined, user_getter_args: unknown[], user_getter_name: string) {
  // try get HTML from custom user renderer, otherwise use bare_value
  if (typeof user_getter === 'function') {
    try {
      const user_html = user_getter(...user_getter_args)
      if (typeof user_html === 'string') {
        return user_html
      }
      else {
        throw new TypeError (`options.${user_getter_name} must return a string, instead returned: ${user_html}`)
      }
    }
    catch (e) {
      console.warn(`Failed to get a string from ${user_getter_name}.`, e)
    }
  }

  const default_html = default_getter()
  if (typeof default_html === 'string') {
    return default_html.trim()
  }

  return ''
}
