import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const MASK_RADIUS = '0.8rem'
const MASK_CLIP = 'inset(var(--mask-y) var(--mask-x) var(--mask-y) var(--mask-x) round var(--mask-radius))'

export default function imagesAnimation(root = document) {
  const imgTrigger = gsap.utils.toArray('[data-a="trigger"]', root)
  const triggers = []
  const timelines = []

  if (!imgTrigger.length) return () => {}

  imgTrigger.forEach((trigger) => {
    const imgWrapper = trigger.querySelector('[data-a="mask-project"]')
    const imgItem = trigger.querySelector('[data-a="scale"]')

    if (!imgWrapper || !imgItem) return

    gsap.set(imgWrapper, {
      overflow: 'hidden',
      '--mask-x': '50%',
      '--mask-y': '50%',
      '--mask-radius': MASK_RADIUS,
      clipPath: MASK_CLIP,
      transformOrigin: '50% 50%',
      willChange: 'clip-path, transform',
    })

    gsap.set(imgItem, {
      scale: 1.2,
      y: '0%',
      willChange: 'transform',
      transformOrigin: '50% 50%',
    })

    const scrollTrigger = {
      id: 'image-reveal',
      trigger,
      start: 'top bottom',
      toggleActions: 'play none none none',
    }

    const tl = gsap.timeline({ scrollTrigger })

    tl.to(imgWrapper, {
      '--mask-x': '0%',
      '--mask-y': '0%',
      '--mask-radius': '0rem',
      duration: 2.4,
      ease: 'power4.out',
    }, 0)
    .to(imgItem, {
      scale: 1,
      duration: 1.5,
      ease: 'power3.out',
    }, 0)

    const scrubTl = gsap.timeline({
      scrollTrigger: {
        id: 'image-scroll',
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })

    scrubTl
      .to(imgWrapper, {
        scale: 1.16,
        y: '-6%',
        ease: 'none',
      }, 0)
      .to(imgItem, {
        y: '-8%',
        ease: 'none',
      }, 0)

    timelines.push(tl)
    timelines.push(scrubTl)
    triggers.push(tl.scrollTrigger)
    triggers.push(scrubTl.scrollTrigger)
  })

  requestAnimationFrame(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
  })

  return () => {
    timelines.forEach((tl) => tl.kill())
    triggers.forEach((trigger) => trigger?.kill())
    imgTrigger.forEach((trigger) => {
      const imgWrapper = trigger.querySelector('[data-a="mask-project"]')
      const imgItem = trigger.querySelector('[data-a="scale"]')

      if (imgWrapper) {
        gsap.set(imgWrapper, { clearProps: 'overflow,clipPath,transform,transformOrigin,willChange,--mask-x,--mask-y,--mask-radius' })
      }
      if (imgItem) {
        gsap.set(imgItem, { clearProps: 'transform,willChange,transformOrigin' })
      }
    })
  }
}
