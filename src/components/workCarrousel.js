import gsap from 'gsap'

const SELECTORS = {
  parent: '.selected-work-parent',
  list: '.selected-work-list',
  item: '.selected-work-item',
  parallaxTarget: '[data-a="ft-project"]',
}

const DRAG_THRESHOLD = 6
const PARALLAX_STRENGTH = 10

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function initWorkCarrousel(root = document) {
  const parent = root.querySelector(SELECTORS.parent)
  const list = parent?.querySelector(SELECTORS.list)
  const items = list ? gsap.utils.toArray(SELECTORS.item, list) : []

  if (!parent || !list || items.length < 2) return () => {}

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
  let suppressClickUntil = 0
  let dragPointerId = null
  let hasPointerCapture = false
  let listTween = null

  const dragContent = gsap.utils.toArray('a, img, video', parent)
  const parallaxItems = items.map((item) => ({
    item,
    target: item.querySelector(SELECTORS.parallaxTarget) || item.querySelector('img, video'),
  })).filter(({ target }) => target)
  const setListX = gsap.quickSetter(list, 'x', 'px')
  const setParallaxX = parallaxItems.map(({ target }) => gsap.quickSetter(target, 'xPercent'))

  const updateParallax = () => {
    const parentRect = parent.getBoundingClientRect()
    const parentCenter = parentRect.left + parentRect.width / 2

    parallaxItems.forEach(({ item }, index) => {
      const itemRect = item.getBoundingClientRect()
      const itemCenter = itemRect.left + itemRect.width / 2
      const progress = clamp((itemCenter - parentCenter) / parentRect.width, -1, 1)

      setParallaxX[index](progress * -PARALLAX_STRENGTH)
    })
  }

  const render = () => {
    setListX(currentX)
    updateParallax()
  }

  const measure = () => {
    maxX = Math.max(0, list.scrollWidth - parent.clientWidth)
    currentX = clamp(currentX, -maxX, 0)
    render()
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
        updateParallax()
      },
      onComplete: () => {
        currentX = target
        listTween = null
        render()
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
  }

  const handlePointerMove = (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return

    const deltaX = event.clientX - dragStartX
    const deltaY = event.clientY - dragStartY

    if (!didDrag && Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) return
    if (Math.abs(deltaY) > Math.abs(deltaX)) return

    event.preventDefault()

    if (!didDrag) {
      didDrag = true
      parent.setPointerCapture?.(dragPointerId)
      hasPointerCapture = true
    }

    const now = performance.now()
    const elapsed = Math.max(16, now - lastDragTime)

    dragVelocity = (event.clientX - lastDragX) / elapsed
    lastDragX = event.clientX
    lastDragTime = now
    currentX = clamp(dragStartPosition + deltaX, -maxX, 0)
    render()
  }

  const handlePointerUp = (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return

    isDragging = false
    dragPointerId = null

    if (hasPointerCapture) {
      parent.releasePointerCapture?.(event.pointerId)
      hasPointerCapture = false
    }

    if (didDrag) {
      suppressClickUntil = performance.now() + 250
      releaseMomentum()
    }

    didDrag = false
  }

  const handleNativeDrag = (event) => {
    event.preventDefault()
  }

  const handleClick = (event) => {
    if (performance.now() > suppressClickUntil) return

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

  gsap.set(items, {
    overflow: 'hidden',
  })

  gsap.set(parallaxItems.map(({ target }) => target), {
    scale: 1.08,
    willChange: 'transform',
    transformOrigin: 'center center',
  })

  gsap.set(dragContent, {
    userSelect: 'none',
    WebkitUserDrag: 'none',
  })

  dragContent.forEach((element) => element.setAttribute('draggable', 'false'))
  measure()

  parent.addEventListener('pointerdown', handlePointerDown)
  parent.addEventListener('pointermove', handlePointerMove)
  parent.addEventListener('pointerup', handlePointerUp)
  parent.addEventListener('pointercancel', handlePointerUp)
  parent.addEventListener('dragstart', handleNativeDrag)
  parent.addEventListener('click', handleClick, true)
  window.addEventListener('resize', measure)

  return ({ preserveStyles = false } = {}) => {
    listTween?.kill()
    parent.removeEventListener('pointerdown', handlePointerDown)
    parent.removeEventListener('pointermove', handlePointerMove)
    parent.removeEventListener('pointerup', handlePointerUp)
    parent.removeEventListener('pointercancel', handlePointerUp)
    parent.removeEventListener('dragstart', handleNativeDrag)
    parent.removeEventListener('click', handleClick, true)
    window.removeEventListener('resize', measure)
    dragContent.forEach((element) => element.removeAttribute('draggable'))

    if (preserveStyles) return

    gsap.set(parent, { clearProps: 'overflow,touchAction,cursor,userSelect' })
    gsap.set(list, { clearProps: 'willChange,transform' })
    gsap.set(items, { clearProps: 'overflow' })
    gsap.set(parallaxItems.map(({ target }) => target), { clearProps: 'transform,willChange,transformOrigin' })
    gsap.set(dragContent, { clearProps: 'userSelect,WebkitUserDrag' })
  }
}
