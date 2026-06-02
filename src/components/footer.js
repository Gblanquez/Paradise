import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  footer: '#contact',
  trigger: '[data-a="foot-trigger"]',
}

export function initFooter(root = document) {
  const footer = root.querySelector(SELECTORS.footer) || document.querySelector(SELECTORS.footer)
  const trigger = root.querySelector(SELECTORS.trigger) || document.querySelector(SELECTORS.trigger)

  if (!footer) return () => {}

  const pinTrigger = ScrollTrigger.create({
    trigger: footer,
    start: 'bottom bottom',
    end: 'bottom top',
    pin: true,
    pinSpacing: false,
    invalidateOnRefresh: true,
  })

  const scrubTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: trigger || footer,
      start: 'bottom bottom',
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true,
    },
  })

  scrubTimeline.fromTo(footer,
    { y: '-30%' },
    {
      y: '0%',
      ease: 'none',
    }
  )

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    removeScrollListener()
    pinTrigger.kill()
    scrubTimeline.scrollTrigger?.kill()
    scrubTimeline.kill()
    gsap.set(footer, { clearProps: 'transform' })
  }
}
