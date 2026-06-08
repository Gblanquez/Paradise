import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const SELECTORS = {
  title: '[data-a="title-text"]',
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

const FONT_WAIT_TIMEOUT = 1000

let activeCleanup = () => {}

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

export default function titleTextReveal(root = document) {
  const targets = gsap.utils.toArray(SELECTORS.title, root)

  activeCleanup()

  if (!targets.length) {
    activeCleanup = () => {}
    return activeCleanup
  }

  const splitInstances = []
  const triggers = []
  const resizeMedia = window.matchMedia('(max-width: 768px)')
  const isMobile = resizeMedia.matches
  let resizeTimer = null

  const waitForFonts = () => {
    if (!document.fonts?.ready) return Promise.resolve()

    return Promise.race([
      document.fonts.ready,
      new Promise((resolve) => {
        window.setTimeout(resolve, FONT_WAIT_TIMEOUT)
      }),
    ])
  }

  const cleanup = () => {
    window.clearTimeout(resizeTimer)

    triggers.forEach((trigger) => trigger.kill())
    triggers.length = 0

    splitInstances.forEach((split) => {
      if (!split._isReverted) {
        split.revert()
        split._isReverted = true
      }
    })
    splitInstances.length = 0
  }

  const build = () => {
    cleanup()

    targets.forEach((el) => {
      if (isMobile && el._titleTextAnimated) return

      const split = SplitText.create(el, {
        type: 'lines,chars',
        autoSplit: true,
        mask: 'lines',
        onSplit: (self) => {
          const gradientLayers = self.chars.map(createGradientLayer).filter(Boolean)

          if (!self.chars.length) {
            gsap.set(el, { autoAlpha: 1 })
            return null
          }

          gsap.set(el, { autoAlpha: 1 })
          gsap.set(self.chars, {
            yPercent: 110,
            position: 'relative',
            display: 'inline-block',
            willChange: 'transform',
          })
          gsap.set(gradientLayers, {
            autoAlpha: 1,
          })

          const tl = gsap.timeline({
            paused: true,
            onComplete: () => {
              gsap.set(self.chars, { clearProps: 'willChange' })
              gsap.set(gradientLayers, { autoAlpha: 0 })
              el._titleTextAnimated = true
            },
          })

          tl.to(self.chars, {
            yPercent: 0,
            duration: 1,
            ease: 'power3.out',
            stagger: {
              each: 0.018,
              from: 'start',
            },
          })

          tl.to(gradientLayers, {
            autoAlpha: 0,
            duration: 0.55,
            ease: 'power2.out',
            stagger: {
              each: 0.018,
              from: 'start',
            },
          }, 0.28)

          const trigger = ScrollTrigger.create({
            id: 'title-text',
            trigger: el,
            start: 'top bottom',
            toggleActions: 'play none none none',
            animation: tl,
            once: isMobile,
          })

          triggers.push(trigger)

          return tl
        },
      })

      split._isReverted = false
      splitInstances.push(split)
    })

    ScrollTrigger.refresh()
  }

  waitForFonts().then(() => {
    requestAnimationFrame(build)
  })

  const handleResize = () => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      waitForFonts().then(() => requestAnimationFrame(build))
    }, 200)
  }

  if (!isMobile) {
    window.addEventListener('resize', handleResize)
  }

  activeCleanup = () => {
    cleanup()
    window.removeEventListener('resize', handleResize)
  }

  return activeCleanup
}
