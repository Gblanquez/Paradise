import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
      clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
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
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
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
        scale: 1.5,
        scaleY: 0.94,
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
      const imgWrapper = trigger.querySelector('[data-a="mask"]')
      const imgItem = trigger.querySelector('[data-a="scale"]')

      gsap.set(imgWrapper || [], { clearProps: 'overflow,clipPath,transform,transformOrigin,willChange' })
      gsap.set(imgItem || [], { clearProps: 'transform,willChange,transformOrigin' })
    })
  }
}
