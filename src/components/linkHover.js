import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

const SELECTORS = {
  trigger: '[data-a="link-hover-trigger"]',
  container: '[data-a="hover-container"]',
  parent: '[data-a="hover-parent"]',
  label: '[data-a="hover-label"]',
  gradientBox: '.hover-g',
  whiteBox: '.hover-w',
}

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

function getElements(targets) {
  return gsap.utils.toArray(targets).filter((target) => target && target.nodeType === 1)
}

function createGradientLayer(char) {
  if (!char.textContent.trim()) return null

  const layer = document.createElement('span')

  layer.textContent = char.textContent
  layer.setAttribute('aria-hidden', 'true')
  layer.style.position = 'absolute'
  layer.style.inset = '0'
  layer.style.pointerEvents = 'none'
  layer.style.background = GRADIENT
  layer.style.backgroundSize = '180% 100%'
  layer.style.backgroundPosition = 'center'
  layer.style.webkitBackgroundClip = 'text'
  layer.style.backgroundClip = 'text'
  layer.style.webkitTextFillColor = 'transparent'
  layer.style.color = 'transparent'

  char.appendChild(layer)

  return layer
}

export function initLinkHover(root = document) {
  if (!root?.querySelectorAll) return () => {}

  const triggers = gsap.utils.toArray(SELECTORS.trigger, root)

  if (!triggers.length) return () => {}

  const instances = triggers.map((trigger) => {
    const container = trigger.closest(SELECTORS.container)
      || trigger.querySelector(SELECTORS.container)
      || trigger
    const parent = trigger.querySelector(SELECTORS.parent)
      || trigger.parentElement?.querySelector(SELECTORS.parent)
    const label = parent?.querySelector(SELECTORS.label)
      || trigger.querySelector(SELECTORS.label)
    const boxes = [
      parent?.querySelector(SELECTORS.gradientBox),
      parent?.querySelector(SELECTORS.whiteBox),
    ].filter(Boolean)
    const boxElements = getElements(boxes)

    if (!parent || !boxElements.length) return null

    let split = null
    let splitChars = []
    let gradientLayers = []
    let enterTl = null
    let leaveTl = null
    const moveX = gsap.quickTo(parent, 'x', {
      duration: 0.35,
      ease: 'power3.out',
    })
    const moveY = gsap.quickTo(parent, 'y', {
      duration: 0.35,
      ease: 'power3.out',
    })

    const moveParent = (event) => {
      const rect = container.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const xProgress = gsap.utils.clamp(0, 1, (event.clientX - rect.left) / rect.width)
      const yProgress = gsap.utils.clamp(0, 1, (event.clientY - rect.top) / rect.height)
      const maxX = rect.width / 2
      const maxY = rect.height / 2
      const x = gsap.utils.mapRange(0, 1, -maxX, maxX, xProgress)
      const y = gsap.utils.mapRange(0, 1, -maxY, maxY, yProgress)

      moveX(x)
      moveY(y)
    }

    const resetParentPosition = () => {
      moveX(0)
      moveY(0)
    }

    const prepareLabel = () => {
      if (!label || split) return

      split = SplitText.create(label, {
        type: 'chars',
      })
      splitChars = getElements(split.chars)
      gradientLayers = getElements(splitChars.map(createGradientLayer))

      if (!splitChars.length) {
        split.revert()
        split = null
        gradientLayers = []
        return
      }

      gsap.set(splitChars, {
        yPercent: 110,
        position: 'relative',
        display: 'inline-block',
        willChange: 'transform',
      })
      gsap.set(gradientLayers, {
        autoAlpha: 1,
        willChange: 'opacity',
      })
    }

    const resetEnterState = () => {
      gsap.set(parent, {
        scale: 0,
        transformOrigin: 'center center',
      })

      gsap.set(boxElements, {
        yPercent: 110,
        rotation: 45,
        transformOrigin: 'left bottom',
        willChange: 'transform',
      })

      if (split) {
        gsap.set(label, { autoAlpha: 0 })
        gsap.set(splitChars, { yPercent: 110 })
        gsap.set(gradientLayers, { autoAlpha: 1 })
      }
    }

    const enter = (event) => {
      leaveTl?.kill()
      enterTl?.kill()
      parent.classList.add('block')
      moveParent(event)
      prepareLabel()
      resetEnterState()

      enterTl = gsap.timeline()

      enterTl.to(parent, {
        scale: 1,
        duration: 0.65,
        ease: 'power3.out',
      }, 0)

      enterTl.to(boxElements, {
        yPercent: 0,
        rotation: 0,
        duration: 0.75,
        ease: 'power3.inOut',
        stagger: 0.08,
        overwrite: true,
      }, 0)

      if (split) {
        enterTl.to(label, {
          autoAlpha: 1,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: true,
        }, 0.12)

        enterTl.to(splitChars, {
          yPercent: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: {
            each: 0.018,
            from: 'start',
          },
          overwrite: true,
        }, 0.18)

        enterTl.to(gradientLayers, {
          autoAlpha: 0,
          duration: 0.55,
          ease: 'power2.out',
          stagger: {
            each: 0.018,
            from: 'start',
          },
          overwrite: true,
        }, 0.45)
      }
    }

    const leave = () => {
      enterTl?.kill()
      leaveTl?.kill()

      leaveTl = gsap.timeline({
        onComplete: () => {
          parent.classList.remove('block')
          gsap.set(parent, { x: 0, y: 0, scale: 0 })
          resetEnterState()
        },
      })

      if (split) {
        leaveTl.to(splitChars, {
          yPercent: -110,
          duration: 0.35,
          ease: 'power3.in',
          stagger: {
            each: 0.01,
            from: 'end',
          },
          overwrite: true,
        }, 0)

        leaveTl.to(label, {
          autoAlpha: 0,
          duration: 0.2,
          ease: 'power2.in',
          overwrite: true,
        }, 0.08)
      }

      leaveTl.to(boxElements, {
        yPercent: -110,
        rotation: -45,
        duration: 0.45,
        ease: 'power3.in',
        stagger: {
          each: 0.05,
          from: 'end',
        },
        overwrite: true,
      }, 0.06)

      leaveTl.to(parent, {
        scale: 0,
        duration: 0.35,
        ease: 'power3.in',
      }, 0.04)
    }

    trigger.addEventListener('pointerenter', enter)
    trigger.addEventListener('pointerleave', leave)
    trigger.addEventListener('focusin', enter)
    trigger.addEventListener('focusout', leave)
    container.addEventListener('pointermove', moveParent)

    return {
      destroy: () => {
        enterTl?.kill()
        leaveTl?.kill()
        trigger.removeEventListener('pointerenter', enter)
        trigger.removeEventListener('pointerleave', leave)
        trigger.removeEventListener('focusin', enter)
        trigger.removeEventListener('focusout', leave)
        container.removeEventListener('pointermove', moveParent)
        parent.classList.remove('block')
        gsap.set(parent, { clearProps: 'transform,transformOrigin' })
        gsap.set(boxElements, { clearProps: 'transform,transformOrigin,willChange' })
        if (label) gsap.set(label, { clearProps: 'opacity,visibility' })
        if (gradientLayers.length) {
          gsap.set(gradientLayers, { clearProps: 'opacity,visibility,willChange' })
        }

        if (split && !split._isReverted) {
          split.revert()
          split._isReverted = true
        }

        splitChars = []
        gradientLayers = []
      },
    }
  }).filter(Boolean)

  if (!instances.length) return () => {}

  return () => {
    instances.forEach((instance) => instance.destroy())
  }
}
