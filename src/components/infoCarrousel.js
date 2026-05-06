import gsap from 'gsap'

const SELECTORS = {
  container: '.swipe-carrousel-container',
  list: '.swipe-carrousel-list',
  item: '.swipe-carrousel-item',
  imageWrapper: '.image-wrapper',
  thumbnailList: '.swipe-c-t-list',
  thumbnailItem: '.swipe-c-t-item',
  previous: '[data-a="c-prev"]',
  next: '[data-a="c-next"]',
  current: '[data-a="c-current"]',
  total: '[data-a="c-all"]',
}

function formatCounter(number, pad) {
  return String(number).padStart(pad, '0')
}

export function initInfoCarrousel(root = document) {
  const container = root.querySelector(SELECTORS.container)
  const list = container?.querySelector(SELECTORS.list)
  const items = list ? gsap.utils.toArray(SELECTORS.item, list) : []

  if (!container || !list || items.length < 2) return () => {}

  const imageWrappers = items.map((item) => item.querySelector(SELECTORS.imageWrapper) || item)
  const thumbnailList = container.querySelector(SELECTORS.thumbnailList)
  const thumbnailItems = thumbnailList ? gsap.utils.toArray(SELECTORS.thumbnailItem, thumbnailList) : []
  const thumbnailWrappers = thumbnailItems.map((item) => item.querySelector(SELECTORS.imageWrapper) || item)
  const previousButtons = gsap.utils.toArray(SELECTORS.previous, container)
  const nextButtons = gsap.utils.toArray(SELECTORS.next, container)
  const currentEls = gsap.utils.toArray(SELECTORS.current, container)
  const totalEls = gsap.utils.toArray(SELECTORS.total, container)
  const pad = Math.max(String(items.length).length, ...currentEls.map((el) => el.textContent.trim().length), ...totalEls.map((el) => el.textContent.trim().length))

  let activeIndex = 0
  let zIndex = items.length
  let transitionId = 0
  const activeTweens = new Set()

  const updateCounters = () => {
    currentEls.forEach((el) => {
      el.textContent = formatCounter(activeIndex + 1, pad)
    })
    totalEls.forEach((el) => {
      el.textContent = formatCounter(items.length, pad)
    })
  }

  const updateThumbnailState = () => {
    const nextThumbnailIndex = gsap.utils.wrap(0, thumbnailItems.length || 1, activeIndex + 1)

    thumbnailItems.forEach((item, index) => {
      const isNextThumbnail = index === nextThumbnailIndex

      item.style.zIndex = isNextThumbnail ? String(thumbnailItems.length + 1) : '0'
      item.style.pointerEvents = isNextThumbnail ? 'auto' : 'none'
      gsap.set(item, { opacity: isNextThumbnail ? 1 : 0 })
      gsap.set(thumbnailWrappers[index], {
        clipPath: isNextThumbnail ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)',
      })
    })
  }

  const goTo = (nextIndex) => {
    const wrappedIndex = gsap.utils.wrap(0, items.length, nextIndex)

    if (wrappedIndex === activeIndex) return

    activeIndex = wrappedIndex
    zIndex += 1
    transitionId += 1
    const currentTransitionId = transitionId

    items[activeIndex].style.zIndex = String(zIndex)
    items[activeIndex].style.pointerEvents = 'auto'
    gsap.set(items[activeIndex], { opacity: 1, visibility: 'visible' })
    gsap.set(imageWrappers[activeIndex], {
      clipPath: 'inset(0 0 0 100%)',
      willChange: 'clip-path',
    })

    const nextThumbnailIndex = thumbnailItems.length
      ? gsap.utils.wrap(0, thumbnailItems.length, activeIndex + 1)
      : -1

    if (thumbnailItems[nextThumbnailIndex]) {
      thumbnailItems[nextThumbnailIndex].style.zIndex = String(thumbnailItems.length + zIndex)
      thumbnailItems[nextThumbnailIndex].style.pointerEvents = 'auto'
      gsap.set(thumbnailItems[nextThumbnailIndex], { opacity: 1 })
      gsap.set(thumbnailWrappers[nextThumbnailIndex], {
        clipPath: 'inset(0 0 0 100%)',
        willChange: 'clip-path',
      })
    }

    updateCounters()

    const tween = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        activeTweens.delete(tween)

        if (currentTransitionId !== transitionId) {
          if (wrappedIndex !== activeIndex) {
            items[wrappedIndex].style.zIndex = '0'
            items[wrappedIndex].style.pointerEvents = 'none'
            gsap.set(items[wrappedIndex], { opacity: 0, visibility: 'hidden' })
            gsap.set(imageWrappers[wrappedIndex], { clipPath: 'inset(0 0 0 100%)' })
          }

          if (nextThumbnailIndex !== gsap.utils.wrap(0, thumbnailItems.length || 1, activeIndex + 1)) {
            if (thumbnailItems[nextThumbnailIndex]) {
              thumbnailItems[nextThumbnailIndex].style.zIndex = '0'
              thumbnailItems[nextThumbnailIndex].style.pointerEvents = 'none'
              gsap.set(thumbnailItems[nextThumbnailIndex], { opacity: 0 })
              gsap.set(thumbnailWrappers[nextThumbnailIndex], { clipPath: 'inset(0 0 0 100%)' })
            }
          }

          return
        }

        items.forEach((item, index) => {
          if (index === activeIndex) {
            item.style.zIndex = String(items.length)
            item.style.pointerEvents = 'auto'
            gsap.set(item, { opacity: 1, visibility: 'visible' })
            return
          }

          item.style.zIndex = '0'
          item.style.pointerEvents = 'none'
          gsap.set(item, { opacity: 0, visibility: 'hidden' })
          gsap.set(imageWrappers[index], { clipPath: 'inset(0 0 0 100%)' })
        })

        zIndex = items.length
        updateThumbnailState()
      },
    })

    activeTweens.add(tween)

    tween.to(imageWrappers[activeIndex], {
      clipPath: 'inset(0 0 0 0%)',
      duration: 0.85,
    }, 0)

    if (thumbnailWrappers[nextThumbnailIndex]) {
      tween.to(thumbnailWrappers[nextThumbnailIndex], {
        clipPath: 'inset(0 0 0 0%)',
        duration: 0.85,
      }, 0)
    }
  }

  const goPrevious = () => goTo(activeIndex - 1)
  const goNext = () => goTo(activeIndex + 1)
  const thumbnailHandlers = thumbnailItems.map((item) => {
    const handler = () => goNext()

    item.addEventListener('click', handler)

    return () => item.removeEventListener('click', handler)
  })

  gsap.set(list, {
    height: '100%',
  })
  gsap.set(items, {
    width: '100%',
    height: '100%',
    willChange: 'opacity',
  })
  gsap.set(imageWrappers, {
    overflow: 'hidden',
    willChange: 'clip-path',
  })
  gsap.set(thumbnailWrappers, {
    overflow: 'hidden',
    willChange: 'clip-path',
  })

  items.forEach((item, index) => {
    item.style.zIndex = index === activeIndex ? String(items.length) : '0'
    item.style.pointerEvents = index === activeIndex ? 'auto' : 'none'
    gsap.set(item, {
      opacity: index === activeIndex ? 1 : 0,
      visibility: index === activeIndex ? 'visible' : 'hidden',
    })
    gsap.set(imageWrappers[index], {
      clipPath: index === activeIndex ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)',
    })
  })

  updateCounters()
  updateThumbnailState()

  previousButtons.forEach((button) => button.addEventListener('click', goPrevious))
  nextButtons.forEach((button) => button.addEventListener('click', goNext))

  return () => {
    activeTweens.forEach((tween) => tween.kill())
    activeTweens.clear()
    previousButtons.forEach((button) => button.removeEventListener('click', goPrevious))
    nextButtons.forEach((button) => button.removeEventListener('click', goNext))
    thumbnailHandlers.forEach((removeHandler) => removeHandler())
    gsap.set(list, { clearProps: 'height' })
    gsap.set(items, { clearProps: 'width,height,willChange,opacity,visibility,zIndex,pointerEvents' })
    gsap.set(imageWrappers, { clearProps: 'overflow,willChange,clipPath' })
    gsap.set(thumbnailItems, { clearProps: 'opacity,zIndex,pointerEvents' })
    gsap.set(thumbnailWrappers, { clearProps: 'overflow,willChange,clipPath' })
  }
}
