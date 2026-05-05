import gsap from 'gsap'

const SELECTORS = {
  parent: '.team-parent',
  list: '.team-list',
  item: '.team-item',
}

const DRAG_THRESHOLD = 6

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function initTeamCarrousel(root = document) {
  const parent = root.querySelector(SELECTORS.parent)
  const list = parent?.querySelector(SELECTORS.list)
  const items = list ? gsap.utils.toArray(SELECTORS.item, list) : []

  if (!parent || !list || items.length < 2) {
    return () => {}
  }

  let dragStartX = 0
  let dragStartY = 0
  let dragStartPosition = 0
  let currentX = 0
  let maxX = 0
  let isDragging = false
  let didDrag = false
  let dragPointerId = null
  let listTween = null

  const setListX = gsap.quickSetter(list, 'x', 'px')

  const measure = () => {
    maxX = Math.max(0, list.scrollWidth - parent.clientWidth)
    currentX = clamp(currentX, -maxX, 0)
    setListX(currentX)
  }

  const snapToNearestItem = () => {
    const nearest = items.reduce((closest, item) => {
      const distance = Math.abs(item.offsetLeft + currentX)
      return distance < closest.distance ? { item, distance } : closest
    }, { item: items[0], distance: Infinity }).item

    const target = clamp(-nearest.offsetLeft, -maxX, 0)

    listTween?.kill()
    listTween = gsap.to(list, {
      x: target,
      duration: 0.55,
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
    currentX = clamp(dragStartPosition + deltaX, -maxX, 0)
    setListX(currentX)
  }

  const handlePointerUp = (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return

    isDragging = false
    dragPointerId = null
    parent.releasePointerCapture?.(event.pointerId)

    if (didDrag) {
      snapToNearestItem()
      window.setTimeout(() => {
        didDrag = false
      }, 0)
    }
  }

  gsap.set(parent, {
    overflow: 'hidden',
    touchAction: 'pan-y',
    cursor: 'grab',
  })

  gsap.set(list, {
    display: 'flex',
    willChange: 'transform',
  })

  measure()

  parent.addEventListener('pointerdown', handlePointerDown)
  parent.addEventListener('pointermove', handlePointerMove)
  parent.addEventListener('pointerup', handlePointerUp)
  parent.addEventListener('pointercancel', handlePointerUp)
  window.addEventListener('resize', measure)

  return () => {
    listTween?.kill()
    parent.removeEventListener('pointerdown', handlePointerDown)
    parent.removeEventListener('pointermove', handlePointerMove)
    parent.removeEventListener('pointerup', handlePointerUp)
    parent.removeEventListener('pointercancel', handlePointerUp)
    window.removeEventListener('resize', measure)
    gsap.set(parent, { clearProps: 'overflow,touchAction,cursor' })
    gsap.set(list, { clearProps: 'display,willChange,transform' })
  }
}
