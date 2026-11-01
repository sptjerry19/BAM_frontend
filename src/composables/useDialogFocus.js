import { onMounted, onBeforeUnmount } from 'vue'

export function useDialogFocus() {
  let observer, current, previous
  const focusable = (dialog) =>
    [
      ...dialog.querySelectorAll(
        'button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
      ),
    ].filter((el) => el.getClientRects().length)
  function update() {
    const dialogs = document.querySelectorAll('.social-overlay .social-dialog')
    const next = dialogs[dialogs.length - 1]
    if (next !== current) {
      if (!current && next) previous = document.activeElement
      current = next
      document.body.classList.toggle('social-dialog-open', Boolean(current))
      if (current) {
        current.setAttribute('role', 'dialog')
        current.setAttribute('aria-modal', 'true')
        current.setAttribute('tabindex', '-1')
        ;(focusable(current)[0] || current).focus()
      } else if (previous?.isConnected) previous.focus()
    }
  }
  function keydown(event) {
    if (!current) return
    if (event.key === 'Escape') {
      event.preventDefault()
      current
        .closest('.social-overlay')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      return
    }
    if (event.key !== 'Tab') return
    const items = focusable(current),
      first = items[0],
      last = items.at(-1)
    if (!first) {
      event.preventDefault()
      current.focus()
      return
    }
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !current.contains(document.activeElement))
    ) {
      event.preventDefault()
      last.focus()
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        !current.contains(document.activeElement))
    ) {
      event.preventDefault()
      first.focus()
    }
  }
  onMounted(() => {
    observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('keydown', keydown, true)
    update()
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    document.removeEventListener('keydown', keydown, true)
    document.body.classList.remove('social-dialog-open')
  })
}
