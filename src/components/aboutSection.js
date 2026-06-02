import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  section: '#about',
  imageWrap: '[data-a="about-img-wrap"]',
  logoWrapper: '.clients-logo-wrapper',
  logoList: '.clients-logo-list',
  logoItem: '.clients-logo-item',
}

function horizontalLoop(items, config = {}) {
  const elements = gsap.utils.toArray(items)

  if (elements.length < 2) return null

  const timeline = gsap.timeline({
    repeat: -1,
    paused: config.paused,
    defaults: { ease: 'none' },
    onReverseComplete: () => {
      timeline.totalTime(timeline.rawTime() + timeline.duration() * 100)
    },
  })
  const length = elements.length
  const startX = elements[0].offsetLeft
  const pixelsPerSecond = (config.speed || 1) * 100
  const widths = []
  const xPercents = []
  const snap = config.snap === false ? (value) => value : gsap.utils.snap(config.snap || 1)

  gsap.set(elements, {
    xPercent: (index, element) => {
      widths[index] = parseFloat(gsap.getProperty(element, 'width', 'px'))
      xPercents[index] = snap(
        (parseFloat(gsap.getProperty(element, 'x', 'px')) / widths[index]) * 100
        + gsap.getProperty(element, 'xPercent')
      )

      return xPercents[index]
    },
  })
  gsap.set(elements, { x: 0 })

  const lastItem = elements[length - 1]
  const totalWidth = lastItem.offsetLeft
    + (xPercents[length - 1] / 100) * widths[length - 1]
    - startX
    + lastItem.offsetWidth * gsap.getProperty(lastItem, 'scaleX')
    + (parseFloat(config.paddingRight) || 0)

  elements.forEach((item, index) => {
    const currentX = (xPercents[index] / 100) * widths[index]
    const distanceToStart = item.offsetLeft + currentX - startX
    const distanceToLoop = distanceToStart + widths[index] * gsap.getProperty(item, 'scaleX')

    timeline
      .to(item, {
        xPercent: snap(((currentX - distanceToLoop) / widths[index]) * 100),
        duration: distanceToLoop / pixelsPerSecond,
      }, 0)
      .fromTo(item, {
        xPercent: snap(((currentX - distanceToLoop + totalWidth) / widths[index]) * 100),
      }, {
        xPercent: xPercents[index],
        duration: (currentX - distanceToLoop + totalWidth - currentX) / pixelsPerSecond,
        immediateRender: false,
      }, distanceToLoop / pixelsPerSecond)
  })

  return timeline
}

export function initAboutSection(root = document) {
  const section = root.querySelector(SELECTORS.section) || document.querySelector(SELECTORS.section)
  const imageWraps = section ? gsap.utils.toArray(SELECTORS.imageWrap, section) : []
  const imageItems = imageWraps.flatMap((wrap) => gsap.utils.toArray(wrap.children))
  const logoWrapper = section?.querySelector(SELECTORS.logoWrapper)
  const logoList = logoWrapper?.querySelector(SELECTORS.logoList)
  const logoItems = logoList ? gsap.utils.toArray(SELECTORS.logoItem, logoList) : []

  if (!section || (!imageWraps.length && !logoItems.length)) return () => {}

  let imageTimeline = null
  let logoTimeline = null
  let resizeTimeout = null

  if (imageWraps.length) {
    gsap.set(imageWraps, {
      clipPath: 'polygon(15% 0%, 85% 0%, 85% 100%, 15% 100%)',
      transformOrigin: 'center center',
      willChange: 'clip-path',
    })

    imageTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom 50%',
        scrub: true,
        invalidateOnRefresh: true,
      },
    })

    imageTimeline.to(imageWraps, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
    }, 0)

    if (imageItems.length) {
      imageTimeline.to(imageItems, {
        y: '10%',
        ease: 'none',
      }, 0)
    }
  }

  const createLogoLoop = () => {
    logoTimeline?.kill()

    if (!logoItems.length) return

    gsap.set(logoItems, {
      flexShrink: 0,
      willChange: 'transform',
    })

    logoTimeline = horizontalLoop(logoItems, {
      speed: 0.7,
      paddingRight: 0,
    })
  }

  const handleResize = () => {
    window.clearTimeout(resizeTimeout)
    resizeTimeout = window.setTimeout(createLogoLoop, 150)
  }

  createLogoLoop()
  window.addEventListener('resize', handleResize)

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    window.clearTimeout(resizeTimeout)
    window.removeEventListener('resize', handleResize)
    removeScrollListener()
    imageTimeline?.scrollTrigger?.kill()
    imageTimeline?.kill()
    logoTimeline?.kill()
    gsap.set(imageWraps, { clearProps: 'clipPath,transform,transformOrigin,willChange' })
    gsap.set(imageItems, { clearProps: 'transform' })
    gsap.set(logoItems, { clearProps: 'x,xPercent,flexShrink,willChange' })
  }
}
