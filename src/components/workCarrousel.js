import gsap from 'gsap'
import { addScrollListener, lenis } from './scroll.js'

const SELECTORS = {
  container: '.work-container',
  list: '.work-list',
  item: '.work-item',
  link: '.work-link',
  contentContainer: '.work-content-container',
  contentList: '.work-content-list',
  contentItem: '.work-content-item',
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

  const formatCounter = (number) => String(number).padStart(counterPad, '0')

  let step = window.innerHeight
  let start = 0
  let activeIndex = -1
  let spacer = document.querySelector(SELECTORS.spacer)

  if (!spacer) {
    spacer = document.createElement('div')
    spacer.dataset.workCarrouselSpacer = ''
    spacer.setAttribute('aria-hidden', 'true')
    container.insertAdjacentElement('afterend', spacer)
  }

  const resize = () => {
    step = window.innerHeight || 1
    start = container.offsetTop
    spacer.style.height = `${step * items.length}px`
    lenis.resize()
    render({ scroll: lenis.scroll })
  }

  const render = ({ scroll }) => {
    const localScroll = scroll - start
    const active = localScroll / step
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
  }

  if (gsap.getProperty(list, 'position') === 'static') {
    gsap.set(list, { position: 'relative' })
  }

  gsap.set(container, {
    position: 'sticky',
    top: 0,
    overflow: 'hidden',
  })

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

  resize()

  const removeScrollListener = addScrollListener(render)
  window.addEventListener('resize', resize)

  return ({ preserveStyles = false } = {}) => {
    removeScrollListener()
    window.removeEventListener('resize', resize)

    if (preserveStyles) return

    spacer.remove()
    gsap.set(container, { clearProps: 'position,top,overflow' })
    gsap.set(list, { clearProps: 'height' })
    gsap.set(items, { clearProps: 'opacity,visibility,willChange,zIndex,pointerEvents,left,top,width,height' })
    gsap.set(links, { clearProps: 'display,width,height,overflow,willChange,transform,clipPath' })
    gsap.set(contentItems, { clearProps: 'opacity,zIndex' })
  }
}
