import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(SplitText, ScrollTrigger)

const SELECTORS = {
  boxWrapper: '.talent-box-wrapper',
  wrapper: '[data-a="talent-wrapper"]',
  trigger: '[data-a="talent-trigger"]',
  content: '[data-a="talent-content"]',
  body: '[data-a="talent-body"]',
  imageWrap: '[data-a="talent-img-wrap"]',
  label: '[data-a="talent-label"]',
  projectImage: '[data-a="talent-p-img"]',
  swiperWrapper: '.talent-swiper-wrapper',
  swiperList: '.talent-swiper-list',
  swiperItem: '.talent-swiper-item',
}

const CLOSED_HEIGHT = '8vw'
const DRAG_THRESHOLD = 6

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getAutoHeight(element) {
  const currentHeight = element.style.height

  element.style.height = 'auto'
  const height = element.offsetHeight
  element.style.height = currentHeight

  return height
}

function splitLines(elements) {
  return elements.map((element) => ({
    element,
    split: SplitText.create(element, {
      type: 'lines',
      mask: 'lines',
    }),
  }))
}

function initTalentCarousel(wrapper) {
  const parent = wrapper.querySelector(SELECTORS.swiperWrapper)
  const list = parent?.querySelector(SELECTORS.swiperList)
  const items = list ? gsap.utils.toArray(SELECTORS.swiperItem, list) : []

  if (!parent || !list || items.length < 2) {
    return {
      measure: () => {},
      destroy: () => {},
    }
  }

  let dragStartX = 0
  let dragStartY = 0
  let dragStartPosition = 0
  let lastDragX = 0
  let lastDragTime = 0
  let dragVelocity = 0
  let currentX = 0
  let maxX = 0
  let isDragging = false
  let didDrag = false
  let dragPointerId = null
  let listTween = null

  const dragContent = gsap.utils.toArray('a, img, video', parent)
  const setListX = gsap.quickSetter(list, 'x', 'px')

  const measure = () => {
    maxX = Math.max(0, list.scrollWidth - parent.clientWidth)
    currentX = clamp(currentX, -maxX, 0)
    setListX(currentX)
  }

  const releaseMomentum = () => {
    const target = clamp(currentX + dragVelocity * 260, -maxX, 0)

    listTween?.kill()
    listTween = gsap.to(list, {
      x: target,
      duration: 0.75,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        currentX = Number(gsap.getProperty(list, 'x'))
      },
      onComplete: () => {
        currentX = target
        listTween = null
      },
    })
  }

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return

    listTween?.kill()
    isDragging = true
    didDrag = false
    dragPointerId = event.pointerId
    dragStartX = event.clientX
    dragStartY = event.clientY
    dragStartPosition = currentX
    lastDragX = event.clientX
    lastDragTime = performance.now()
    dragVelocity = 0
    parent.setPointerCapture?.(dragPointerId)
  }

  const handlePointerMove = (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return

    const deltaX = event.clientX - dragStartX
    const deltaY = event.clientY - dragStartY

    if (!didDrag && Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) return
    if (Math.abs(deltaY) > Math.abs(deltaX)) return

    event.preventDefault()
    didDrag = true

    const now = performance.now()
    const elapsed = Math.max(16, now - lastDragTime)

    dragVelocity = (event.clientX - lastDragX) / elapsed
    lastDragX = event.clientX
    lastDragTime = now
    currentX = clamp(dragStartPosition + deltaX, -maxX, 0)
    setListX(currentX)
  }

  const handlePointerUp = (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return

    isDragging = false
    dragPointerId = null
    parent.releasePointerCapture?.(event.pointerId)

    if (didDrag) {
      releaseMomentum()
      window.setTimeout(() => {
        didDrag = false
      }, 0)
    }
  }

  const handleNativeDrag = (event) => {
    event.preventDefault()
  }

  const handleClick = (event) => {
    if (!didDrag) return

    event.preventDefault()
    event.stopPropagation()
  }

  gsap.set(parent, {
    overflow: 'hidden',
    touchAction: 'pan-y',
    cursor: 'grab',
    userSelect: 'none',
  })

  gsap.set(list, {
    willChange: 'transform',
    xPercent: -210,
  })

  gsap.set(dragContent, {
    userSelect: 'none',
    WebkitUserDrag: 'none',
  })

  dragContent.forEach((element) => element.setAttribute('draggable', 'false'))
  measure()

  parent.addEventListener('pointerdown', handlePointerDown, true)
  parent.addEventListener('pointermove', handlePointerMove)
  parent.addEventListener('pointerup', handlePointerUp)
  parent.addEventListener('pointercancel', handlePointerUp)
  parent.addEventListener('dragstart', handleNativeDrag)
  parent.addEventListener('click', handleClick, true)
  window.addEventListener('resize', measure)

  return {
    measure,
    destroy: () => {
      listTween?.kill()
      parent.removeEventListener('pointerdown', handlePointerDown, true)
      parent.removeEventListener('pointermove', handlePointerMove)
      parent.removeEventListener('pointerup', handlePointerUp)
      parent.removeEventListener('pointercancel', handlePointerUp)
      parent.removeEventListener('dragstart', handleNativeDrag)
      parent.removeEventListener('click', handleClick, true)
      window.removeEventListener('resize', measure)
      dragContent.forEach((element) => element.removeAttribute('draggable'))
      gsap.set(parent, { clearProps: 'overflow,touchAction,cursor,userSelect' })
      gsap.set(list, { clearProps: 'willChange,transform' })
      gsap.set(dragContent, { clearProps: 'userSelect,WebkitUserDrag' })
    },
  }
}

export function initTalent(root = document) {
  const wrappers = gsap.utils.toArray(SELECTORS.wrapper, root)
  const boxWrappers = gsap.utils.toArray(SELECTORS.boxWrapper, root)

  if (!wrappers.length && !boxWrappers.length) return () => {}

  let activeAccordion = null
  const revealTriggers = []
  const removeScrollListener = boxWrappers.length ? addScrollListener(() => ScrollTrigger.update()) : () => {}

  if (boxWrappers.length) {
    gsap.set(boxWrappers, {
      opacity: 0,
      rotation: -45,
      transformOrigin: 'top right',
      willChange: 'opacity, transform',
    })

    boxWrappers.forEach((box, index) => {
      const trigger = ScrollTrigger.create({
        trigger: box,
        start: 'top bottom',
        onEnter: () => {
          gsap.to(box, {
            opacity: 1,
            rotation: 0,
            duration: 0.8,
            delay: index * 0.01,
            ease: 'power3.out',
            overwrite: true,
            onComplete: () => {
              gsap.set(box, { clearProps: 'willChange' })
            },
          })
        },
        onLeaveBack: () => {
          gsap.killTweensOf(box)
          gsap.set(box, {
            opacity: 0,
            rotation: -45,
            transformOrigin: 'top right',
            willChange: 'opacity, transform',
          })
        },
      })

      revealTriggers.push(trigger)
    })
  }

  const accordions = wrappers.map((wrapper) => {
    const trigger = wrapper.querySelector(SELECTORS.trigger)
    const content = wrapper.querySelector(SELECTORS.content)
    const labels = gsap.utils.toArray(SELECTORS.label, wrapper)
    const bodies = gsap.utils.toArray(SELECTORS.body, wrapper)
    const imageWrap = wrapper.querySelector(SELECTORS.imageWrap)
    const projectImages = gsap.utils.toArray(SELECTORS.projectImage, wrapper)
    const swiperList = wrapper.querySelector(SELECTORS.swiperList)

    if (!trigger || !content) return { destroy: () => {} }

    const textSplits = splitLines([...labels, ...bodies])
    const textLines = textSplits.flatMap(({ split }) => split.lines)
    const talentCarousel = initTalentCarousel(wrapper)
    let isOpen = false
    let activeTween = null
    let accordion = null

    gsap.set(wrapper, {
      height: CLOSED_HEIGHT,
      overflow: 'hidden',
    })

    gsap.set(content, {
      clipPath: 'inset(0 0 100% 0)',
      overflow: 'hidden',
      willChange: 'clip-path',
    })

    gsap.set(textLines, {
      yPercent: 100,
    })

    gsap.set(imageWrap, {
      overflow: 'hidden',
    })

    gsap.set(projectImages, {
      scale: 0.2,
      transformOrigin: 'center center',
      willChange: 'transform',
    })

    const open = () => {
      if (isOpen) return

      if (activeAccordion && activeAccordion !== accordion) {
        activeAccordion.close()
      }

      activeAccordion = accordion
      isOpen = true
      activeTween?.kill()

      const targetHeight = getAutoHeight(wrapper)

      activeTween = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => {
          gsap.set(wrapper, { height: 'auto' })
          talentCarousel.measure()
          activeTween = null
        },
      })

      activeTween.to(wrapper, {
        height: targetHeight,
        duration: 0.75,
      }, 0)

      activeTween.to(content, {
        clipPath: 'inset(0 0 0% 0)',
        duration: 0.75,
      }, 0.05)

      if (textLines.length) {
        activeTween.to(textLines, {
          yPercent: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.05,
        }, 0.18)
      }

      if (projectImages.length) {
        activeTween.to(projectImages, {
          scale: 1,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.08,
        }, 0.18)
      }

      if (swiperList) {
        activeTween.to(swiperList, {
          xPercent: 0,
          duration: 0.85,
          ease: 'power3.out',
        }, 0.18)
      }
    }

    const close = () => {
      if (!isOpen) return

      isOpen = false
      activeTween?.kill()

      if (activeAccordion === accordion) {
        activeAccordion = null
      }

      activeTween = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => {
          activeTween = null
        },
      })

      activeTween.to(content, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.45,
      }, 0)

      activeTween.to(wrapper, {
        height: CLOSED_HEIGHT,
        duration: 0.55,
      }, 0)

      activeTween.set(textLines, { yPercent: 100 })
      activeTween.set(projectImages, { scale: 0.5 })
      activeTween.set(swiperList, { xPercent: -210 })
    }

    const toggle = () => {
      if (isOpen) {
        close()
        return
      }

      open()
    }

    trigger.addEventListener('click', toggle)

    accordion = {
      close,
      destroy: () => {
        activeTween?.kill()
        trigger.removeEventListener('click', toggle)
        if (activeAccordion === accordion) {
          activeAccordion = null
        }
        talentCarousel.destroy()
        textSplits.forEach(({ split }) => split.revert())
        gsap.set(wrapper, { clearProps: 'height,overflow' })
        gsap.set(content, { clearProps: 'clipPath,overflow,willChange' })
        gsap.set(imageWrap, { clearProps: 'overflow' })
        gsap.set(projectImages, { clearProps: 'transform,transformOrigin,willChange' })
      },
    }

    return accordion
  })

  return () => {
    revealTriggers.forEach((trigger) => trigger.kill())
    removeScrollListener()
    gsap.set(boxWrappers, { clearProps: 'opacity,transform,transformOrigin,willChange' })
    accordions.forEach((accordion) => accordion.destroy())
  }
}
