import gsap from 'gsap'

const SELECTORS = {
  cta: '[data-a="cta"]',
  svgWrap: '[data-a="cta-svg-wrap"]',
  label: '[data-a="cta-label"]',
  svg: '.cta-svg',
  path: 'path',
}

const CIRCLE_PATH = 'M9.8 5.33155C9.8 8.09297 7.76142 10.3315 5 10.3315L5 10.3315C2.23858 10.3315 0.2 8.09297 0.2 5.33155L0.2 5.33155C0.2 2.57013 2.23858 0.331545 5 0.331545L5 0.331545C7.76142 0.331545 9.8 2.57013 9.8 5.33155L9.8 5.33155Z'
const ARROW_PATH = 'M9 4.46552C9.66667 4.85042 9.66667 5.81267 9 6.19757L1.5 10.5277C0.833334 10.9126 4.2477e-07 10.4315 4.58419e-07 9.66167L8.3697e-07 1.00142C8.7062e-07 0.231615 0.833334 -0.24951 1.5 0.13539L9 4.46552Z'
const GRADIENT = `linear-gradient(
  90deg,
  #c9f5ff 0%,
  #7bb6ff 13%,
  #121421 29%,
  #020000 34%,
  #170000 39%,
  #d94520 57%,
  #df5ca6 68%,
  #d98cff 75%,
  #111018 85%,
  #f28db3 91%,
  #2e8ef7 100%
)`

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

function applyGradientText(label) {
  if (!label) return

  label.style.backgroundImage = GRADIENT
  label.style.backgroundSize = '220% 100%'
  label.style.backgroundPosition = '0% 50%'
  label.style.webkitBackgroundClip = 'text'
  label.style.backgroundClip = 'text'
  label.style.webkitTextFillColor = 'transparent'
  label.style.color = 'transparent'
}

function clearGradientText(label) {
  if (!label) return

  label.style.removeProperty('background-image')
  label.style.removeProperty('background-size')
  label.style.removeProperty('background-position')
  label.style.removeProperty('-webkit-background-clip')
  label.style.removeProperty('background-clip')
  label.style.removeProperty('-webkit-text-fill-color')
  label.style.removeProperty('color')
}

export function initCta(root = document) {
  const ctas = gsap.utils.toArray(SELECTORS.cta, root)

  if (!ctas.length) return () => {}

  const items = ctas.map((cta) => {
    const svgWrap = findRelatedElement(cta, SELECTORS.svgWrap)
    const svg = findRelatedElement(cta, SELECTORS.svg)
    const path = svg?.querySelector(SELECTORS.path)
    const label = findRelatedElement(cta, SELECTORS.label)
    let tween = null

    if (!svgWrap && !path && !label) {
      return { destroy: () => {} }
    }

    gsap.set(cta, {
      scaleX: 1,
      transformOrigin: 'right center',
      willChange: 'transform',
    })

    gsap.set(svgWrap || [], {
      x: '0rem',
      willChange: 'transform',
    })

    gsap.set(path || [], {
      attr: { d: CIRCLE_PATH },
    })

    const show = () => {
      tween?.kill()
      applyGradientText(label)

      tween = gsap.timeline({
        defaults: {
          duration: 0.5,
          ease: 'power3.inOut',
          overwrite: true,
        },
      })
        .to(cta, {
          scaleX: 0.96,
        }, 0)
        .to(svgWrap || [], {
          x: '10rem',
        }, 0)
        .to(path || [], {
          attr: { d: ARROW_PATH },
        }, 0)
        .to(label || [], {
          backgroundPosition: '100% 50%',
          duration: 0.8,
          ease: 'none',
        }, 0)
    }

    const hide = () => {
      tween?.kill()

      tween = gsap.timeline({
        defaults: {
          duration: 0.45,
          ease: 'power3.inOut',
          overwrite: true,
        },
        onComplete: () => clearGradientText(label),
      })
        .to(cta, {
          scaleX: 1,
        }, 0)
        .to(svgWrap || [], {
          x: '0rem',
        }, 0)
        .to(path || [], {
          attr: { d: CIRCLE_PATH },
        }, 0)
        .to(label || [], {
          backgroundPosition: '220% 50%',
          duration: 0.35,
          ease: 'none',
        }, 0)
    }

    cta.addEventListener('pointerenter', show)
    cta.addEventListener('pointerleave', hide)
    cta.addEventListener('focus', show)
    cta.addEventListener('blur', hide)

    return {
      destroy: () => {
        tween?.kill()
        cta.removeEventListener('pointerenter', show)
        cta.removeEventListener('pointerleave', hide)
        cta.removeEventListener('focus', show)
        cta.removeEventListener('blur', hide)
        clearGradientText(label)
        gsap.set(cta, { clearProps: 'transform,transformOrigin,willChange' })
        gsap.set(svgWrap || [], { clearProps: 'transform,willChange' })
        gsap.set(path || [], { clearProps: 'attr' })
      },
    }
  })

  return () => {
    items.forEach((item) => item.destroy())
  }
}
