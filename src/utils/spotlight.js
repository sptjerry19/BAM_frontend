/**
 * Feeds the pointer position into `--mx` / `--my` on the nearest `.spotlight`
 * ancestor so its border can light up under the cursor. One delegated listener
 * keeps this off the per-card render path; updates are batched per frame.
 */
export function trackSpotlight() {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(hover: none)').matches) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  let target = null
  let frame = null

  function apply() {
    frame = null
    if (!target) return
    const rect = target.el.getBoundingClientRect()
    target.el.style.setProperty('--mx', `${target.x - rect.left}px`)
    target.el.style.setProperty('--my', `${target.y - rect.top}px`)
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      const el = event.target.closest?.('.spotlight')
      if (!el) {
        target = null
        return
      }
      target = { el, x: event.clientX, y: event.clientY }
      if (frame === null) frame = requestAnimationFrame(apply)
    },
    { passive: true },
  )
}
