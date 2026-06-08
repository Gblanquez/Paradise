import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const FONT_WAIT_TIMEOUT = 2500

export default function bodyTextReveal(root = document) {
  const targets = gsap.utils.toArray('[data-a="body-text"]', root)

  if (!targets.length) return () => {}

  let splitInstances = []
  let triggers = []
  let resizeTimer = null

  const isMobile = window.matchMedia('(max-width: 768px)').matches

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
    clearTimeout(resizeTimer)

    triggers.forEach((trigger) => trigger.kill())
    triggers = []

    splitInstances.forEach((inst) => {
      if (inst && !inst._isReverted) {
        inst.revert()
        inst._isReverted = true
      }
    })

    splitInstances = []
  }

  const build = () => {
    cleanup()

    targets.forEach((el) => {
      if (isMobile && el._animated) return

      const split = SplitText.create(el, {
        type: 'lines,words',
        autoSplit: true,
        mask: 'lines',
        onSplit: (self) => {
          if (!self.lines.length) {
            gsap.set(el, { autoAlpha: 1 })
            return null
          }

          gsap.set(self.lines, {
            yPercent: 100,
            willChange: 'transform',
          })
          gsap.set(el, { autoAlpha: 1 })

          const tl = gsap.timeline({
            paused: true,
            onComplete: () => {
              self.revert()
              self._isReverted = true
              el._animated = true
            },
          })

          tl.to(self.lines, {
            yPercent: 0,
            duration: 1.05,
            ease: 'power3.out',
            stagger: 0.06,
          })

          const trigger = ScrollTrigger.create({
            id: 'body-text',
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

  const handleResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      waitForFonts().then(() => requestAnimationFrame(build))
    }, 200)
  }

  waitForFonts().then(() => {
    requestAnimationFrame(build)
  })

  if (!isMobile) {
    window.addEventListener('resize', handleResize)
  }

  return () => {
    cleanup()
    window.removeEventListener('resize', handleResize)
  }
}
