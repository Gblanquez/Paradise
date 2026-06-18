import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

let rafId = null

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
  overscroll: false,
  autoRaf: false,
})

let onScrollUpdate = () => {}
const scrollListeners = new Set()

function customRAF(time) {
  rafId = requestAnimationFrame(customRAF)

  lenis.raf(time)

  const scrollState = {
    scroll: lenis.scroll,
    velocity: lenis.velocity,
    progress: lenis.progress,
    time
  }

  onScrollUpdate(scrollState)
  scrollListeners.forEach((listener) => listener(scrollState))
}

function setOnScrollUpdate(cb) {
  onScrollUpdate = cb
}

function addScrollListener(cb) {
  scrollListeners.add(cb)

  return () => {
    scrollListeners.delete(cb)
  }
}

function startRAF() {
  if (!rafId) {
    rafId = requestAnimationFrame(customRAF)
  }
}

function stopRAF() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function scrollToHash(hash, options = {}) {
  if (!hash) return false

  if (hash === '#hero') {
    return scrollToTop(options)
  }

  const target = document.querySelector(hash)

  if (!target) return false

  lenis.scrollTo(target, {
    offset: 0,
    force: true,
    ...options,
  })

  return true
}

function scrollToTop(options = {}) {
  lenis.scrollTo(0, {
    offset: 0,
    force: true,
    duration: 1.6,
    easing: (t) => (
      t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2
    ),
    ...options,
  })

  return true
}

export { lenis, startRAF, stopRAF, setOnScrollUpdate, addScrollListener, scrollToHash, scrollToTop }

startRAF()
