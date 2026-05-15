import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  line: '.line',
}

export function initLines(root = document) {
  const lines = gsap.utils.toArray(SELECTORS.line, root)
  const triggers = []

  if (!lines.length) return () => {}

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())

  const createLineTrigger = (line) => {
    const reset = () => {
      gsap.killTweensOf(line)
      gsap.set(line, {
        scaleX: 0,
        transformOrigin: 'top right',
        willChange: 'transform',
      })
    }

    const play = () => {
      gsap.to(line, {
        scaleX: 1,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: true,
        onComplete: () => {
          gsap.set(line, { clearProps: 'willChange' })
        },
      })
    }

    reset()

    const trigger = ScrollTrigger.create({
      trigger: line,
      start: 'top bottom',
      onEnter: play,
      once: true,
    })

    triggers.push(trigger)
  }

  lines.forEach((line) => {
    createLineTrigger(line)
  })

  window.requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    triggers.forEach((trigger) => trigger.kill())
    removeScrollListener()
    gsap.killTweensOf(lines)
    gsap.set(lines, { clearProps: 'transform,transformOrigin,willChange' })
  }
}
