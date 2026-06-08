const MOBILE_QUERY = '(max-width: 480px)'

export const setVw = () => {
  document.documentElement.style.setProperty('--vw', `${window.innerWidth / 100}px`)
}

export function initScaling() {
  const media = window.matchMedia(MOBILE_QUERY)
  let isResizeActive = false

  const enableResize = () => {
    if (isResizeActive) return

    isResizeActive = true
    setVw()
    window.addEventListener('resize', setVw)
  }

  const disableResize = () => {
    if (!isResizeActive) return

    isResizeActive = false
    window.removeEventListener('resize', setVw)
  }

  const sync = () => {
    if (media.matches) {
      disableResize()
      return
    }

    enableResize()
  }

  sync()
  media.addEventListener?.('change', sync)

  return () => {
    disableResize()
    media.removeEventListener?.('change', sync)
  }
}
