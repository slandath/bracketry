export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  timeout = 300,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Args): void => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, timeout)
  }
}

export function throttle_with_trailing<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  let ready = true
  let args: Args | null = null

  const throttled = (...callArgs: Args): void => {
    if (ready) {
      ready = false

      setTimeout(() => {
        ready = true
        if (args) {
          throttled(...args)
          args = null
        }
      }, delay)

      callback(...(args ?? callArgs))
      args = null
    }
    else {
      args = callArgs
    }
  }

  return throttled
}

export function within_range(number: number, min: number, max: number): number {
  return Math.max(Math.min(number, max), min)
}

export function is_object(
  variable: unknown,
): variable is Record<string, unknown> {
  return (
    typeof variable === 'object'
    && !Array.isArray(variable)
    && variable !== null
  )
}

export function is_valid_number(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v)
}

export function create_element_from_Html(htmlString: string): HTMLElement {
  if (typeof htmlString !== 'string') {
    console.warn(
      'create_element_from_Html expects an html string, instead got:',
      htmlString,
    )
    return document.createElement('div')
  }

  const div = document.createElement('div')
  div.innerHTML = htmlString.trim()

  if (!div.firstElementChild) {
    console.warn(
      `create_element_from_Html: failed to create an element from string: "${htmlString}"`,
    )
    return document.createElement('div')
  }

  return div.firstElementChild as HTMLElement
}

export function remove_whitespace_from_html(str: string): string {
  return str.replace(/>\s+</g, '><')
}

function insert_styles(
  root_id: string,
  styles_id: string,
  styles: string,
): void {
  document.head.insertAdjacentHTML(
    'beforeend',
    `<style id='${root_id}-${styles_id}'>${styles}</style>`,
  )
}

export function get_n_things<T>(n: number, cb: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => cb(i))
}

export function do_n_times(n: number, cb: () => void): void {
  for (let i = 0; i < n; i++) cb()
}

export function update_styles(
  root_id: string,
  styles_id: string,
  styles: string,
): void {
  const current_styles_node = document.head.querySelector<HTMLStyleElement>(
    `#${root_id}-${styles_id}`,
  )
  if (current_styles_node) {
    document.head.removeChild(current_styles_node)
  }
  insert_styles(root_id, styles_id, styles)
}

// underscore’s "snapshot"
export function deep_clone_object<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const temp = new (obj.constructor as new () => T)() as Record<string, unknown>
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      temp[key] = deep_clone_object((obj as Record<string, unknown>)[key])
    }
  }
  return temp as T
}

export function observe_resize_later(
  el: HTMLElement,
  cb: () => void,
): ResizeObserver {
  let was_resized = false
  const res_obs = new ResizeObserver(
    debounce(() => {
      if (!was_resized) {
        was_resized = true
        return
      }

      if (!el.closest('html'))
        return // do nothing if removed
      cb()
    }),
  )
  res_obs.observe(el)
  return res_obs
}
