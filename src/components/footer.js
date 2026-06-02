import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener, lenis } from './scroll.js'

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
	
  let refreshFrame = null
  let refreshTimer = null
  const refreshFooter = () => {
    if (refreshFrame) window.cancelAnimationFrame(refreshFrame)
    if (refreshTimer) window.clearTimeout(refreshTimer)

    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = window.requestAnimationFrame(() => {
        lenis.resize()
        ScrollTrigger.refresh()
        refreshTimer = window.setTimeout(() => {
          lenis.resize()
          ScrollTrigger.refresh()
        }, 120)
      })
    })
  }

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.addEventListener('page:entered', refreshFooter)
  window.addEventListener('projects:layout-ready', refreshFooter)
  window.addEventListener('load', refreshFooter)
  refreshFooter()

  return () => {
    removeScrollListener()
    window.removeEventListener('page:entered', refreshFooter)
    window.removeEventListener('projects:layout-ready', refreshFooter)
    window.removeEventListener('load', refreshFooter)
    if (refreshFrame) window.cancelAnimationFrame(refreshFrame)
    if (refreshTimer) window.clearTimeout(refreshTimer)
    pinTrigger.kill()
    scrubTimeline.scrollTrigger?.kill()
    scrubTimeline.kill()
    gsap.set(footer, { clearProps: 'transform' })
  }
}
