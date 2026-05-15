import gsap from 'gsap'

const SELECTORS = {
  parent: '.why-swiper-parent',
  list: '.why-swiper-list',
  item: '.why-swiper-item',
  next: '.why-next-toggle',
  prev: '.why-prev-toggle',
}

const DRAG_THRESHOLD = 6

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function initWhySection(root = document) {
  const parents = gsap.utils.toArray(SELECTORS.parent, root)
  const fallbackNextToggle = root.querySelector(SELECTORS.next) || document.querySelector(SELECTORS.next)
  const fallbackPrevToggle = root.querySelector(SELECTORS.prev) || document.querySelector(SELECTORS.prev)

  if (!parents.length) return () => {}

  const sliders = parents.map((parent) => {
    const list = parent.querySelector(SELECTORS.list)
    const items = list ? gsap.utils.toArray(SELECTORS.item, list) : []
    const nextToggle = parent.querySelector(SELECTORS.next) || fallbackNextToggle
    const prevToggle = parent.querySelector(SELECTORS.prev) || fallbackPrevToggle

    if (!list || items.length < 2) return { destroy: () => {} }

    let activeIndex = 0
    let currentX = 0
    let maxX = 0
    let tween = null
    let dragStartX = 0
    let dragStartY = 0
    let dragStartPosition = 0
    let lastDragX = 0
    let lastDragTime = 0
    let dragVelocity = 0
    let isDragging = false
    let didDrag = false
    let dragPointerId = null

    const dragContent = gsap.utils.toArray('a, img, video', parent)
    const setListX = gsap.quickSetter(list, 'x', 'px')

    const setControls = () => {
      const isAtStart = currentX >= -1
      const isAtEnd = currentX <= -maxX + 1

      gsap.set(prevToggle, {
        opacity: isAtStart ? 0.4 : 1,
        pointerEvents: isAtStart ? 'none' : 'auto',
      })

      gsap.set(nextToggle, {
        opacity: isAtEnd ? 0.4 : 1,
        pointerEvents: isAtEnd ? 'none' : 'auto',
      })
    }

    const getTargetX = (index) => {
      const target = -items[index].offsetLeft

      return clamp(target, -maxX, 0)
    }

    const getClosestIndex = (targetX = currentX) => {
      let closestIndex = 0
      let closestDistance = Infinity

      items.forEach((item, index) => {
        const distance = Math.abs(getTargetX(index) - targetX)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      return closestIndex
    }

    const render = (value) => {
      currentX = clamp(value, -maxX, 0)
      setListX(currentX)
      activeIndex = getClosestIndex()
      setControls()
    }

    const goTo = (index) => {
      activeIndex = clamp(index, 0, items.length - 1)
      tween?.kill()

      tween = gsap.to(list, {
        x: getTargetX(activeIndex),
        duration: 0.75,
        ease: 'power3.inOut',
        overwrite: true,
        onUpdate: () => {
          currentX = Number(gsap.getProperty(list, 'x'))
        },
        onComplete: () => {
          currentX = getTargetX(activeIndex)
          tween = null
          render(currentX)
        },
      })

      setControls()
    }

    const measure = () => {
      maxX = Math.max(0, list.scrollWidth - parent.clientWidth)
      render(getTargetX(activeIndex))
    }

    const goNext = () => goTo(getClosestIndex() + 1)
    const goPrev = () => goTo(getClosestIndex() - 1)

    const releaseMomentum = () => {
      const targetX = clamp(currentX + dragVelocity * 260, -maxX, 0)

      tween?.kill()
      tween = gsap.to(list, {
        x: targetX,
        duration: 0.75,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: () => {
          currentX = Number(gsap.getProperty(list, 'x'))
          activeIndex = getClosestIndex()
          setControls()
        },
        onComplete: () => {
          tween = null
          render(targetX)
        },
      })
    }

    const handlePointerDown = (event) => {
      if (event.button !== undefined && event.button !== 0) return

      tween?.kill()
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
      render(dragStartPosition + deltaX)
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
    })

    gsap.set(dragContent, {
      userSelect: 'none',
      WebkitUserDrag: 'none',
    })

    dragContent.forEach((element) => element.setAttribute('draggable', 'false'))
    measure()

    nextToggle?.addEventListener('click', goNext)
    prevToggle?.addEventListener('click', goPrev)
    parent.addEventListener('pointerdown', handlePointerDown, true)
    parent.addEventListener('pointermove', handlePointerMove)
    parent.addEventListener('pointerup', handlePointerUp)
    parent.addEventListener('pointercancel', handlePointerUp)
    parent.addEventListener('dragstart', handleNativeDrag)
    parent.addEventListener('click', handleClick, true)
    window.addEventListener('resize', measure)

    return {
      destroy: () => {
        tween?.kill()
        nextToggle?.removeEventListener('click', goNext)
        prevToggle?.removeEventListener('click', goPrev)
        parent.removeEventListener('pointerdown', handlePointerDown, true)
        parent.removeEventListener('pointermove', handlePointerMove)
        parent.removeEventListener('pointerup', handlePointerUp)
        parent.removeEventListener('pointercancel', handlePointerUp)
        parent.removeEventListener('dragstart', handleNativeDrag)
        parent.removeEventListener('click', handleClick, true)
        window.removeEventListener('resize', measure)
        dragContent.forEach((element) => element.removeAttribute('draggable'))
        gsap.set(parent, { clearProps: 'overflow,touchAction,cursor,userSelect' })
        gsap.set(list, { clearProps: 'transform,willChange' })
        gsap.set(dragContent, { clearProps: 'userSelect,WebkitUserDrag' })
        gsap.set([nextToggle, prevToggle].filter(Boolean), { clearProps: 'opacity,pointerEvents' })
      },
    }
  })

  return () => {
    sliders.forEach((slider) => slider.destroy())
  }
}
