import gsap from 'gsap'
import { canUseHover } from './hoverSupport.js'

const SELECTORS = {
  item: '[team="item"]',
  image: '[team="hover-img"]',
}

export function initTeamHoverAnimation(root = document) {
  if (!root?.querySelectorAll) return () => {}
  if (!canUseHover()) return () => {}

  const items = gsap.utils.toArray(SELECTORS.item, root)
  const images = gsap.utils.toArray(SELECTORS.image, root)

  if (!items.length || !images.length) return () => {}

  const instances = items.map((item, index) => {
    const image = images[index]

    if (!image) return null

    let enterTween = null
    let leaveTween = null

    gsap.set(image, {
      display: 'none',
      opacity: 0,
      willChange: 'opacity',
    })

    const enter = () => {
      leaveTween?.kill()
      enterTween?.kill()

      gsap.set(image, { display: 'block' })

      enterTween = gsap.to(image, {
        opacity: 1,
        duration: 0.45,
        ease: 'power3.out',
        overwrite: true,
      })
    }

    const leave = () => {
      enterTween?.kill()
      leaveTween?.kill()

      leaveTween = gsap.to(image, {
        opacity: 0,
        duration: 0.3,
        ease: 'power3.out',
        overwrite: true,
        onComplete: () => {
          gsap.set(image, { display: 'none' })
        },
      })
    }

    item.addEventListener('pointerenter', enter)
    item.addEventListener('pointerleave', leave)
    item.addEventListener('focus', enter)
    item.addEventListener('blur', leave)

    return () => {
      enterTween?.kill()
      leaveTween?.kill()
      item.removeEventListener('pointerenter', enter)
      item.removeEventListener('pointerleave', leave)
      item.removeEventListener('focus', enter)
      item.removeEventListener('blur', leave)
      gsap.set(image, { clearProps: 'display,opacity,willChange' })
    }
  }).filter(Boolean)

  if (!instances.length) return () => {}

  return () => {
    instances.forEach((destroy) => destroy())
  }
}
