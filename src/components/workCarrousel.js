import gsap from 'gsap'
import { lenis } from './scroll.js'

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
  const setItemAutoAlpha = items.map((item) => gsap.quickSetter(item, 'autoAlpha'))
  const setLinkX = links.map((link) => gsap.quickSetter(link, 'xPercent'))
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
  let lastTouchX = null
  let lastTouchY = null
  const scrollState = { value: 0 }
  const previousBodyOverflow = document.body.style.overflow
  const previousHtmlOverflow = document.documentElement.style.overflow
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
    step = window.innerHeight || 1
    lenis.resize()
    render({ scroll: scrollState.value })
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

      setItemAutoAlpha[index](isVisible ? 1 : 0)

      if (isIncoming) {
        const reveal = distance * 100

        setLinkX[index](distance * 12)
        setLinkClipPath[index](`inset(0 0 0 ${reveal}%)`)

        item.style.zIndex = String(items.length + 1)
        item.style.pointerEvents = distance < 0.5 ? 'auto' : 'none'
        return
      }

      if (isOutgoing) {
        setLinkX[index](distance * 4)
        setLinkClipPath[index]('inset(0 0 0 0%)')

        item.style.zIndex = String(items.length)
        item.style.pointerEvents = 'none'
        return
      }

      setLinkX[index](0)
      setLinkClipPath[index]('inset(0 0 0 100%)')
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

        setThumbnailClipPath[index](`inset(0 0 0 ${reveal}%)`)
        item.style.zIndex = String(thumbnailItems.length + 1)
        return
      }

      if (isOutgoing) {
        setThumbnailClipPath[index]('inset(0 0 0 0%)')
        item.style.zIndex = String(thumbnailItems.length)
        return
      }

      setThumbnailClipPath[index]('inset(0 0 0 100%)')
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

  const handleWheel = (event) => {
    event.preventDefault()
    moveCarousel(event.deltaY || event.deltaX)
  }

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0]

    lastTouchX = touch?.clientX ?? null
    lastTouchY = touch?.clientY ?? null
  }

  const handleTouchMove = (event) => {
    if (lastTouchX === null || lastTouchY === null) return

    const touch = event.touches?.[0]
    const nextTouchX = touch?.clientX ?? lastTouchX
    const nextTouchY = touch?.clientY ?? lastTouchY
    const deltaX = lastTouchX - nextTouchX
    const deltaY = lastTouchY - nextTouchY
    const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY

    lastTouchX = nextTouchX
    lastTouchY = nextTouchY

    if (event.cancelable) {
      event.preventDefault()
    }

    moveCarousel(delta * 2)
  }

  const handleTouchEnd = () => {
    lastTouchX = null
    lastTouchY = null
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

  gsap.set(contentItems, {
    opacity: 0,
  })

  resize()
  window.requestAnimationFrame(resize)

  window.addEventListener('resize', resize)
  window.addEventListener('wheel', handleWheel, { passive: false })
  container.addEventListener('touchstart', handleTouchStart, { passive: true })
  container.addEventListener('touchmove', handleTouchMove, { passive: false })
  container.addEventListener('touchend', handleTouchEnd)
  container.addEventListener('touchcancel', handleTouchEnd)

  return ({ preserveStyles = false } = {}) => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('wheel', handleWheel)
    container.removeEventListener('touchstart', handleTouchStart)
    container.removeEventListener('touchmove', handleTouchMove)
    container.removeEventListener('touchend', handleTouchEnd)
    container.removeEventListener('touchcancel', handleTouchEnd)
    window.clearTimeout(snapTimeout)
    scrollTween?.kill()
    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow

    if (preserveStyles) return

    spacer.remove()
    gsap.set(container, { clearProps: 'position,inset,width,height,top,overflow,touchAction,overscrollBehavior,zIndex' })
    gsap.set(list, { clearProps: 'height' })
    gsap.set(items, { clearProps: 'opacity,visibility,willChange,zIndex,pointerEvents,left,top,width,height' })
    gsap.set(links, { clearProps: 'display,width,height,overflow,willChange,transform,clipPath' })
    gsap.set(contentItems, { clearProps: 'opacity,zIndex' })
    gsap.set(thumbnailItems, { clearProps: 'opacity,zIndex' })
    gsap.set(thumbnailContainers, { clearProps: 'willChange,clipPath' })
  }
}
