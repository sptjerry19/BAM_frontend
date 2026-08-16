import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'jb_theme'
const TRANSITION_MS = 1520

/** @type {import('vue').Ref<'dark' | 'light'>} */
const theme = ref(readInitial())

const isDark = computed(() => theme.value === 'dark')
const isLight = computed(() => theme.value === 'light')

function readInitial() {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* private mode */
  }
  return 'light'
}

function apply(next) {
  const root = document.documentElement
  root.classList.toggle('theme-light', next === 'light')
  root.classList.toggle('theme-dark', next === 'dark')
  root.style.colorScheme = next
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', next === 'light' ? '#ffffff' : '#111111')
}

function setTheme(next) {
  theme.value = next === 'light' ? 'light' : 'dark'
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Soft CSS fallback when View Transitions API is unavailable.
 */
function animateWithCss(next) {
  const root = document.documentElement
  root.classList.add('theme-animating')
  setTheme(next)
  window.setTimeout(() => {
    root.classList.remove('theme-animating')
  }, TRANSITION_MS)
}

/**
 * Circular wipe from the click point (or viewport center).
 * @param {MouseEvent | { clientX?: number, clientY?: number } | undefined} event
 */
function animateWithViewTransition(next, event) {
  const root = document.documentElement
  const x = event?.clientX ?? Math.round(window.innerWidth / 2)
  const y = event?.clientY ?? Math.round(window.innerHeight / 2)
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  root.classList.add('theme-vt')

  const transition = document.startViewTransition(() => {
    setTheme(next)
  })

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: TRANSITION_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
    .catch(() => {
      /* transition aborted */
    })

  transition.finished.finally(() => {
    root.classList.remove('theme-vt')
  })
}

/**
 * @param {MouseEvent | { clientX?: number, clientY?: number } | undefined} event
 */
function toggleTheme(event) {
  const next = theme.value === 'dark' ? 'light' : 'dark'

  if (prefersReducedMotion()) {
    setTheme(next)
    return
  }

  if (typeof document.startViewTransition === 'function') {
    animateWithViewTransition(next, event)
    return
  }

  animateWithCss(next)
}

watch(
  theme,
  (next) => {
    apply(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  },
  { immediate: true },
)

export function useTheme() {
  return {
    theme,
    isDark,
    isLight,
    setTheme,
    toggleTheme,
  }
}
