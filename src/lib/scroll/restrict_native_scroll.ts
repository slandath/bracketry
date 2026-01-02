// https://stackoverflow.com/a/4770179

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36

const SCROLL_KEYS = [
  ' ',
  'PageUp',
  'PageDown',
  'End',
  'Home',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
]
function preventDefaultForScrollKeys(e: KeyboardEvent) {
  if (SCROLL_KEYS.includes(e.key) && !e.shiftKey && !e.altKey && !e.ctrlKey) {
    preventDefault(e)
    return false
  }
}

function preventDefault(e: Event) {
  e.preventDefault()
}

// modern Chrome requires { passive: false } when adding event
let supportsPassive = false
try {
  window.addEventListener(
    'test',
    () => {},
    Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true
      },
    }),
  )
}
catch (e) {
  console.debug('Passive events not supported:', e)
}

const wheelOpt: AddEventListenerOptions | boolean = supportsPassive
  ? { passive: false }
  : false
const wheelEvent
  = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel'

export function restrict_native_scroll(el: Element, make_scroll_jump: (delta: number) => void) {
  const deputise_for_wheel = (e: WheelEvent) => {
    if (
      el.classList // window has no classList
      && el.classList.contains('matches-scroller')
      && !el.classList.contains('scroll-y-enabled')
    ) {
      return
    }
    e.preventDefault()
    make_scroll_jump(e.deltaY)
  }

  el.addEventListener('DOMMouseScroll', preventDefault as EventListener, false) // older FF
  el.addEventListener(
    wheelEvent,
    deputise_for_wheel as EventListener,
    wheelOpt,
  ) // modern desktop
  el.addEventListener(
    'keydown',
    preventDefaultForScrollKeys as EventListener,
    false,
  )

  const release_native_scroll = () => {
    el.removeEventListener('DOMMouseScroll', preventDefault, false)
    el.removeEventListener(
      wheelEvent,
      deputise_for_wheel as EventListener,
      wheelOpt,
    )
    el.removeEventListener('touchmove', preventDefault, wheelOpt)
    el.removeEventListener(
      'keydown',
      preventDefaultForScrollKeys as EventListener,
      false,
    )
  }

  return release_native_scroll
}
