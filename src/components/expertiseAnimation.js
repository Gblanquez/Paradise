import gsap from 'gsap'
import { canUseHover } from './hoverSupport.js'

const SELECTORS = {
  trigger: '[expertise="item"]',
  image: '[expertise="img"]',
}

export function initExpertiseAnimation(root = document) {
  if (!root?.querySelectorAll) return () => {}
  if (!canUseHover()) return () => {}

  const triggers = gsap.utils.toArray(SELECTORS.trigger, root)
  const allImages = gsap.utils.toArray(SELECTORS.image, root)

  if (!triggers.length || !allImages.length) return () => {}

  gsap.set(allImages, {
    '--expertise-mask-x': '50%',
    '--expertise-mask-y': '50%',
    clipPath: 'inset(var(--expertise-mask-y) var(--expertise-mask-x) var(--expertise-mask-y) var(--expertise-mask-x))',
    webkitClipPath: 'inset(var(--expertise-mask-y) var(--expertise-mask-x) var(--expertise-mask-y) var(--expertise-mask-x))',
    transformOrigin: 'center center',
    willChange: 'clip-path,-webkit-clip-path',
  })

  const instances = triggers.map((trigger) => {
    const images = gsap.utils.toArray(SELECTORS.image, trigger)

    if (!images.length) return null

    let enterTween = null
    let leaveTween = null

    const enter = () => {
      leaveTween?.kill()
      enterTween?.kill()

      gsap.set(images, {
        '--expertise-mask-x': '50%',
        '--expertise-mask-y': '50%',
      })

      enterTween = gsap.to(images, {
        '--expertise-mask-x': '0%',
        '--expertise-mask-y': '0%',
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.04,
        overwrite: true,
      })
    }

    const leave = () => {
      enterTween?.kill()
      leaveTween?.kill()

      leaveTween = gsap.to(images, {
        '--expertise-mask-x': '50%',
        '--expertise-mask-y': '50%',
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.02,
        overwrite: true,
      })
    }

    trigger.addEventListener('pointerenter', enter)
    trigger.addEventListener('pointerleave', leave)
    trigger.addEventListener('focus', enter)
    trigger.addEventListener('blur', leave)

    return () => {
      enterTween?.kill()
      leaveTween?.kill()
      trigger.removeEventListener('pointerenter', enter)
      trigger.removeEventListener('pointerleave', leave)
      trigger.removeEventListener('focus', enter)
      trigger.removeEventListener('blur', leave)
    }
  }).filter(Boolean)

  if (!instances.length) return () => {}

  return () => {
    instances.forEach((destroy) => destroy())
    gsap.set(allImages, {
      clearProps: '--expertise-mask-x,--expertise-mask-y,clipPath,webkitClipPath,transformOrigin,willChange',
    })
  }
}
