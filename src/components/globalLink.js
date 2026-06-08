import gsap from 'gsap'
import { canUseHover } from './hoverSupport.js'

const SELECTORS = {
  link: '[data-a="global-link"]',
  hoverBox: '.lk-hover-box',
}

export function initGlobalLink(root = document) {
  const links = gsap.utils.toArray(SELECTORS.link, root)

  if (!links.length) return () => {}

  const linkGroups = links
    .map((link) => ({
      link,
      boxes: gsap.utils.toArray(SELECTORS.hoverBox, link),
    }))
    .filter(({ boxes }) => boxes.length)

  if (!linkGroups.length) return () => {}

  const allBoxes = linkGroups.flatMap(({ boxes }) => boxes)

  gsap.set(allBoxes, {
    width: '0%',
    height: '100%',
  })

  if (!canUseHover()) return () => {
    gsap.killTweensOf(allBoxes)
    gsap.set(allBoxes, { clearProps: 'width,height' })
  }

  const show = (boxes) => {
    gsap.to(boxes, {
      width: '100%',
      duration: 0.45,
      ease: 'power3.out',
      overwrite: true,
    })
  }

  const hide = (boxes) => {
    gsap.to(boxes, {
      width: '0%',
      duration: 0.45,
      ease: 'power3.inOut',
      overwrite: true,
    })
  }

  const removeListeners = linkGroups.map(({ link, boxes }) => {
    const onEnter = () => show(boxes)
    const onLeave = () => hide(boxes)

    link.addEventListener('pointerenter', onEnter)
    link.addEventListener('pointerleave', onLeave)
    link.addEventListener('focus', onEnter)
    link.addEventListener('blur', onLeave)

    return () => {
      link.removeEventListener('pointerenter', onEnter)
      link.removeEventListener('pointerleave', onLeave)
      link.removeEventListener('focus', onEnter)
      link.removeEventListener('blur', onLeave)
    }
  })

  return () => {
    removeListeners.forEach((removeListener) => removeListener())
    gsap.killTweensOf(allBoxes)
    gsap.set(allBoxes, { clearProps: 'width,height' })
  }
}
