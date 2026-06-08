import gsap from 'gsap'
import { canUseHover } from './hoverSupport.js'

const SELECTORS = {
  cta: '[data-a="cta"]',
  svgWrap: '[data-a="cta-svg-wrap"]',
  globalLinkBox: '.global-link-box',
  svg: '.cta-svg',
  path: 'path',
}

const CIRCLE_PATH = 'M9.8 5.33155C9.8 8.09297 7.76142 10.3315 5 10.3315L5 10.3315C2.23858 10.3315 0.2 8.09297 0.2 5.33155L0.2 5.33155C0.2 2.57013 2.23858 0.331545 5 0.331545L5 0.331545C7.76142 0.331545 9.8 2.57013 9.8 5.33155L9.8 5.33155Z'
const ARROW_PATH = 'M9 4.46552C9.66667 4.85042 9.66667 5.81267 9 6.19757L1.5 10.5277C0.833334 10.9126 4.2477e-07 10.4315 4.58419e-07 9.66167L8.3697e-07 1.00142C8.7062e-07 0.231615 0.833334 -0.24951 1.5 0.13539L9 4.46552Z'

function findRelatedElement(element, selector) {
  let current = element

  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current.matches?.(selector)) return current

    const match = current.querySelector(selector)

    if (match) return match

    current = current.parentElement
  }

  return null
}

export function initCta(root = document) {
  const ctas = gsap.utils.toArray(SELECTORS.cta, root)
  const supportsHover = canUseHover()

  if (!ctas.length) return () => {}

  const items = ctas.map((cta) => {
    const svgWrap = findRelatedElement(cta, SELECTORS.svgWrap)
    const svg = findRelatedElement(cta, SELECTORS.svg)
    const path = svg?.querySelector(SELECTORS.path)
    const globalLinkBox = findRelatedElement(cta, SELECTORS.globalLinkBox)
    let tween = null

    if (!svgWrap && !path && !globalLinkBox) {
      return { destroy: () => {} }
    }

    if (svgWrap) {
      gsap.set(svgWrap, {
        x: '0rem',
        willChange: 'transform',
      })
    }

    if (path) {
      gsap.set(path, {
        attr: { d: CIRCLE_PATH },
      })
    }

    if (globalLinkBox) {
      gsap.set(globalLinkBox, {
        scale: 0,
        x: '20%',
        y: '-50%',
        rotation: 45,
        transformOrigin: 'top right',
        willChange: 'transform',
      })
    }

    const show = () => {
      tween?.kill()

      tween = gsap.timeline({
        defaults: {
          duration: 0.5,
          ease: 'power3.inOut',
          overwrite: true,
        },
      })

      if (globalLinkBox) {
        tween.to(globalLinkBox, {
          scale: 1.3,
          x: '0%',
          y: '0%',
          rotation: 0,
        }, 0)
      }
      if (svgWrap) {
        tween.to(svgWrap, {
          x: '10rem',
        }, 0)
      }
      if (path) {
        tween.to(path, {
          attr: { d: ARROW_PATH },
        }, 0)
      }
    }

    const hide = () => {
      tween?.kill()

      tween = gsap.timeline({
        defaults: {
          duration: 0.45,
          ease: 'power3.inOut',
          overwrite: true,
        },
      })

      if (globalLinkBox) {
        tween.to(globalLinkBox, {
          scale: 0,
          x: '20%',
          y: '-50%',
          rotation: 45,
        }, 0)
      }
      if (svgWrap) {
        tween.to(svgWrap, {
          x: '0rem',
        }, 0)
      }
      if (path) {
        tween.to(path, {
          attr: { d: CIRCLE_PATH },
        }, 0)
      }
    }

    if (supportsHover) {
      cta.addEventListener('pointerenter', show)
      cta.addEventListener('pointerleave', hide)
      cta.addEventListener('focus', show)
      cta.addEventListener('blur', hide)
    }

    return {
      destroy: () => {
        tween?.kill()
        if (supportsHover) {
          cta.removeEventListener('pointerenter', show)
          cta.removeEventListener('pointerleave', hide)
          cta.removeEventListener('focus', show)
          cta.removeEventListener('blur', hide)
        }
        if (svgWrap) {
          gsap.set(svgWrap, { clearProps: 'transform,willChange' })
        }
        if (globalLinkBox) {
          gsap.set(globalLinkBox, { clearProps: 'transform,transformOrigin,willChange' })
        }
        if (path) {
          gsap.set(path, { clearProps: 'attr' })
        }
      },
    }
  })

  return () => {
    items.forEach((item) => item.destroy())
  }
}
