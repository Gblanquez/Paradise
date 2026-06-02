import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  mask: '[data-a="mask"]',
}

export function initMask(root = document) {
  const masks = gsap.utils.toArray(SELECTORS.mask, root)

  if (!masks.length) return () => {}

  const timelines = masks.map((mask) => {
    gsap.set(mask, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      willChange: 'clip-path',
    })

    return gsap.timeline({
      scrollTrigger: {
        trigger: mask,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    }).to(mask, {
      clipPath: 'polygon(0% 10%, 100% 10%, 100% 100%, 0% 100%)',
      ease: 'none',
    })
  })

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    removeScrollListener()
    timelines.forEach((timeline) => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
    })
    gsap.set(masks, { clearProps: 'clipPath,willChange' })
  }
}
