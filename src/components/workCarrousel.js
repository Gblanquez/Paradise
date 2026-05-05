import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { lenis } from './scroll.js'

gsap.registerPlugin(Observer)

const SELECTORS = {
  container: '.work-container',
  list: '.work-list',
  item: '.work-item',
  link: '.work-link',
  contentContainer: '.work-content-container',
  contentList: '.work-content-list',
  contentItem: '.work-content-item',
  thumbnailsList: '.thumbnails-list',
  thumbnailItem: '.thumbnail-item',
  thumbnailContainer: '.thumbnail-container',
  current: '.work-current',
  length: '.work-length',
  spacer: '[data-work-carrousel-spacer]',
}

const CSS_PROPS = {
  clipPath: 'clip-path',
  pointerEvents: 'pointer-events',
  touchAction: 'touch-action',
  overscrollBehavior: 'overscroll-behavior',
  willChange: 'will-change',
  zIndex: 'z-index',
}

function clearInlineProps(targets, props) {
  gsap.utils.toArray(targets).forEach((target) => {
    props.forEach((prop) => {
      target.style.removeProperty(CSS_PROPS[prop] || prop)
    })
  })
}

export function initWorkCarrousel() {
  const list = document.querySelector(SELECTORS.list)
  const container = list?.closest(SELECTORS.container)

  if (!list || !container) return () => {}

  const items = gsap.utils.toArray(SELECTORS.item, list)

  if (items.length < 2) return () => {}

  const wrapDistance = gsap.utils.wrap(-items.length / 2, items.length / 2)
  const links = items.map((item) => item.querySelector(SELECTORS.link) || item)
  const contentList = container.querySelector(SELECTORS.contentList)
  const contentItems = gsap.utils.toArray(SELECTORS.contentItem, contentList || container)
  const thumbnailsList = container.querySelector(SELECTORS.thumbnailsList)
  const thumbnailItems = gsap.utils.toArray(SELECTORS.thumbnailItem, thumbnailsList || container)
  const thumbnailContainers = thumbnailItems.map((item) => item.querySelector(SELECTORS.thumbnailContainer) || item)
  const currentEls = gsap.utils.toArray(SELECTORS.current, container)
  const lengthEls = gsap.utils.toArray(SELECTORS.length, container)
  const counterPad = Math.max(
    String(items.length).length,
    ...currentEls.map((el) => el.textContent.trim().length),
    ...lengthEls.map((el) => el.textContent.trim().length)
  )
  const setItemOpacity = items.map((item) => gsap.quickSetter(item, 'opacity'))
  const setLinkX = links.map((link) => gsap.quickSetter(link, 'xPercent'))
  const setLinkY = links.map((link) => gsap.quickSetter(link, 'yPercent'))
  const setLinkClipPath = links.map((link) => gsap.quickSetter(link, 'clipPath'))
  const setContentOpacity = contentItems.map((item) => gsap.quickSetter(item, 'opacity'))
  const setThumbnailOpacity = thumbnailItems.map((item) => gsap.quickSetter(item, 'opacity'))
  const setThumbnailClipPath = thumbnailContainers.map((item) => gsap.quickSetter(item, 'clipPath'))

  const formatCounter = (number) => String(number).padStart(counterPad, '0')

  let step = window.innerHeight
  let activeIndex = -1
  let snapTimeout = null
  let isSnapping = false
  let scrollTween = null
  let targetScroll = 0
  let isMobile = window.innerWidth <= 480
  const scrollState = { value: 0 }
  const previousBodyOverflow = document.body.style.overflow
  const previousHtmlOverflow = document.documentElement.style.overflow
  let observer = null
  let spacer = document.querySelector(SELECTORS.spacer)

  if (!spacer) {
    spacer = document.createElement('div')
    spacer.dataset.workCarrouselSpacer = ''
    spacer.setAttribute('aria-hidden', 'true')
    container.insertAdjacentElement('afterend', spacer)
  }

  gsap.set(spacer, {
    height: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
  })

  const resize = () => {
    isMobile = window.innerWidth <= 480
    step = (window.innerHeight || 1) * (isMobile ? 0.25 : 1)
    lenis.resize()
    render({ scroll: scrollState.value })
  }

  const setRevealClipPath = (setter, reveal) => {
    if (!isMobile) {
      setter(`inset(0 0 0 ${reveal}%)`)
      return
    }

    setter(`inset(${reveal}% 0 0 0)`)
  }

  const render = ({ scroll }) => {
    const active = scroll / step
    const nextActiveIndex = gsap.utils.wrap(0, items.length, Math.round(active))

    if (nextActiveIndex !== activeIndex) {
      activeIndex = nextActiveIndex
      currentEls.forEach((el) => {
        el.textContent = formatCounter(activeIndex + 1)
      })
      lengthEls.forEach((el) => {
        el.textContent = formatCounter(items.length)
      })
    }

    items.forEach((item, index) => {
      const distance = wrapDistance(index - active)
      const isIncoming = distance >= 0 && distance < 1
      const isOutgoing = distance < 0 && distance > -1
      const isVisible = isIncoming || isOutgoing

      setItemOpacity[index](isVisible ? 1 : 0)
      item.style.visibility = isVisible ? 'visible' : 'hidden'

      if (isIncoming) {
        const reveal = distance * 100

        setLinkX[index](isMobile ? 0 : distance * 12)
        setLinkY[index](isMobile ? distance * 12 : 0)
        setRevealClipPath(setLinkClipPath[index], reveal)

        item.style.zIndex = String(items.length + 1)
        item.style.pointerEvents = distance < 0.5 ? 'auto' : 'none'
        return
      }

      if (isOutgoing) {
        setLinkX[index](isMobile ? 0 : distance * 4)
        setLinkY[index](isMobile ? distance * 4 : 0)
        setLinkClipPath[index]('inset(0 0 0 0%)')

        item.style.zIndex = String(items.length)
        item.style.pointerEvents = 'none'
        return
      }

      setLinkX[index](0)
      setLinkY[index](0)
      setRevealClipPath(setLinkClipPath[index], 100)
      item.style.zIndex = '0'
      item.style.pointerEvents = 'none'
    })

    contentItems.forEach((item, index) => {
      if (index === activeIndex) {
        item.style.zIndex = String(contentItems.length + 1)
        setContentOpacity[index](1)
      } else {
        item.style.zIndex = '0'
        setContentOpacity[index](0)
      }
    })

    thumbnailItems.forEach((item, index) => {
      const distance = wrapDistance(index - active - 1)
      const isIncoming = distance >= 0 && distance < 1
      const isOutgoing = distance < 0 && distance > -1
      const isVisible = isIncoming || isOutgoing

      setThumbnailOpacity[index](isVisible ? 1 : 0)

      if (isIncoming) {
        const reveal = distance * 100

        setRevealClipPath(setThumbnailClipPath[index], reveal)
        item.style.zIndex = String(thumbnailItems.length + 1)
        return
      }

      if (isOutgoing) {
        setThumbnailClipPath[index]('inset(0 0 0 0%)')
        item.style.zIndex = String(thumbnailItems.length)
        return
      }

      setRevealClipPath(setThumbnailClipPath[index], 100)
      item.style.zIndex = '0'
    })
  }

  const snapToNearestItem = () => {
    const snapIndex = Math.round(scrollState.value / step)
    const target = snapIndex * step

    if (Math.abs(scrollState.value - target) < 2) return

    isSnapping = true
    targetScroll = target
    scrollTween?.kill()
    scrollTween = gsap.to(scrollState, {
      value: target,
      duration: 0.75,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => render({ scroll: scrollState.value }),
      onComplete: () => {
        isSnapping = false
        scrollTween = null
      },
    })
  }

  const scheduleSnap = (velocity) => {
    if (isSnapping) return

    window.clearTimeout(snapTimeout)

    if (Math.abs(velocity) > 2) {
      snapTimeout = window.setTimeout(snapToNearestItem, 180)
      return
    }

    snapTimeout = window.setTimeout(snapToNearestItem, 80)
  }

  const moveCarousel = (delta) => {
    if (!delta) return

    if (isSnapping) {
      isSnapping = false
    }

    targetScroll += delta
    scrollTween?.kill()
    scrollTween = gsap.to(scrollState, {
      value: targetScroll,
      duration: 0.65,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => render({ scroll: scrollState.value }),
      onComplete: () => {
        scrollTween = null
      },
    })
    scheduleSnap(delta)
  }

  const handleGesture = (self) => {
    const deltaX = self.deltaX || 0
    const deltaY = self.deltaY || 0
    const delta = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX

    moveCarousel(delta)
  }

  if (gsap.getProperty(list, 'position') === 'static') {
    gsap.set(list, { position: 'relative' })
  }

  gsap.set(container, {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100dvh',
    top: 0,
    overflow: 'hidden',
    touchAction: 'none',
    overscrollBehavior: 'none',
    zIndex: 1,
  })

  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  lenis.stop()

  gsap.set(list, {
    height: '100%',
  })

  gsap.set(items, {
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    willChange: 'opacity',
  })

  gsap.set(links, {
    display: 'block',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    willChange: 'transform, clip-path',
  })

  gsap.set(thumbnailContainers, {
    willChange: 'clip-path',
  })

  resize()

  observer = Observer.create({
    target: container,
    type: 'wheel,touch,pointer',
    preventDefault: true,
    allowClicks: true,
    tolerance: 2,
    dragMinimum: 3,
    wheelSpeed: 1,
    onChange: handleGesture,
  })
  window.addEventListener('resize', resize)

  return ({ preserveStyles = false } = {}) => {
    observer?.kill()
    window.removeEventListener('resize', resize)
    window.clearTimeout(snapTimeout)
    scrollTween?.kill()
    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow
    lenis.start()

    if (preserveStyles) return

    spacer.remove()
    clearInlineProps(container, ['position', 'inset', 'width', 'height', 'top', 'overflow', 'touchAction', 'overscrollBehavior', 'zIndex'])
    clearInlineProps(list, ['height'])
    clearInlineProps(items, ['opacity', 'visibility', 'willChange', 'zIndex', 'pointerEvents', 'left', 'top', 'width', 'height'])
    clearInlineProps(links, ['display', 'width', 'height', 'overflow', 'willChange', 'transform', 'clipPath'])
    clearInlineProps(contentItems, ['opacity', 'zIndex'])
    clearInlineProps(thumbnailItems, ['opacity', 'zIndex'])
    clearInlineProps(thumbnailContainers, ['willChange', 'clipPath'])
  }
}
