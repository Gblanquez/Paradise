import gsap from 'gsap'
import { canUseHover } from './hoverSupport.js'

const SELECTORS = {
  container: '.story-carrousel-container',
  wrapper: '.vertical-videos-wrapper',
  story: '.story-wrapper',
  video: '.vertical-video',
  line: '.load-vertical-line',
  playToggleParent: '.play-toggle-parent',
  playToggle: '[data-a="play-toggle"]',
}

const DRAG_THRESHOLD = 6

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getLoadProgress(video) {
  if (!video.duration || !Number.isFinite(video.duration) || video.buffered.length === 0) {
    return video.readyState >= 2 ? 0.65 : 0
  }

  return video.buffered.end(video.buffered.length - 1) / video.duration
}

function waitForVideo(video, updateProgress) {
  return new Promise((resolve) => {
    let timeout = null

    const complete = () => {
      cleanup()
      updateProgress(1)
      resolve()
    }

    const update = () => {
      updateProgress(Math.max(0.12, getLoadProgress(video) * 0.95))
    }

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', update)
      video.removeEventListener('loadeddata', update)
      video.removeEventListener('progress', update)
      video.removeEventListener('canplay', complete)
      video.removeEventListener('canplaythrough', complete)
      video.removeEventListener('error', complete)

      if (timeout) {
        window.clearTimeout(timeout)
      }
    }

    if (video.readyState >= 3) {
      complete()
      return
    }

    timeout = window.setTimeout(complete, 8000)

    video.addEventListener('loadedmetadata', update)
    video.addEventListener('loadeddata', update)
    video.addEventListener('progress', update)
    video.addEventListener('canplay', complete, { once: true })
    video.addEventListener('canplaythrough', complete, { once: true })
    video.addEventListener('error', complete, { once: true })

    video.load()
    update()
  })
}

export function initVerticalVideos(root = document) {
  const supportsHover = canUseHover()
  const container = root.querySelector(SELECTORS.container)
  const wrapper = container?.querySelector(SELECTORS.wrapper)

  if (!container || !wrapper) {
    return {
      pause: () => {},
      destroy: () => {},
    }
  }

  const stories = gsap.utils.toArray(SELECTORS.story, wrapper)
  const items = stories.map((story) => ({
    story,
    video: story.querySelector(SELECTORS.video),
    line: story.querySelector(SELECTORS.line),
    playToggleParent: story.querySelector(SELECTORS.playToggleParent),
    playToggle: story.querySelector(SELECTORS.playToggle),
    loadTween: null,
    lineTween: null,
    requestId: 0,
    isLoading: false,
  })).filter(({ video, line }) => video && line)

  if (!items.length) {
    return {
      pause: () => {},
      destroy: () => {},
    }
  }

  let activeItem = null
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
  let pendingTapItem = null
  let wrapperTween = null

  const setWrapperX = gsap.quickSetter(wrapper, 'x', 'px')
  const itemByStory = new Map(items.map((item) => [item.story, item]))

  const setToggleLabel = (item, label) => {
    if (!item?.playToggle) return

    item.playToggle.textContent = label
  }

  const syncToggleLabels = () => {
    items.forEach((item) => {
      setToggleLabel(item, item === activeItem && !item.video.paused ? 'pause' : 'play')
    })
  }

  const showToggle = (item) => {
    if (!item?.playToggleParent) return

    gsap.to(item.playToggleParent, {
      opacity: 1,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  const hideToggle = (item) => {
    if (!item?.playToggleParent) return

    gsap.to(item.playToggleParent, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  const measure = () => {
    maxX = Math.max(0, wrapper.scrollWidth - container.clientWidth)
    currentX = clamp(currentX, -maxX, 0)
    setWrapperX(currentX)
  }

  const releaseMomentum = () => {
    const target = clamp(currentX + dragVelocity * 260, -maxX, 0)

    wrapperTween?.kill()
    wrapperTween = gsap.to(wrapper, {
      x: target,
      duration: 0.75,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        currentX = Number(gsap.getProperty(wrapper, 'x'))
      },
      onComplete: () => {
        currentX = target
        wrapperTween = null
      },
    })
  }

  const pauseItem = (item) => {
    if (!item?.video) return

    item.video.pause()
    syncToggleLabels()
  }

  const resetLine = (item) => {
    item.loadTween?.kill()
    item.lineTween?.kill()
    item.loadTween = null
    item.lineTween = null

    gsap.set(item.line, {
      width: '0%',
      scaleX: 1,
      transformOrigin: 'right center',
    })
  }

  const pauseAll = () => {
    items.forEach(pauseItem)
  }

  const playItem = async (item) => {
    if (!item || activeItem === item) {
      if (!item?.video) return

      if (item.isLoading) {
        item.requestId += 1
        item.isLoading = false
        item.video.pause()
        resetLine(item)
        activeItem = null
        syncToggleLabels()
        return
      }

      if (item.video.paused) {
        item.video.play().catch(() => {})
      } else {
        item.video.pause()
      }

      syncToggleLabels()

      return
    }

    if (activeItem) {
      activeItem.requestId += 1
      activeItem.isLoading = false
      activeItem.video.pause()
      syncToggleLabels()
    }

    activeItem = item

    item.requestId += 1
    const requestId = item.requestId
    item.isLoading = true

    items.forEach((otherItem) => {
      if (otherItem !== item) {
        resetLine(otherItem)
      }
    })

    item.video.pause()
    item.video.playsInline = true
    item.video.setAttribute('playsinline', '')
    item.video.preload = 'auto'
    resetLine(item)

    const setProgress = (progress) => {
      if (requestId !== item.requestId) return

      item.loadTween?.kill()
      item.loadTween = gsap.to(item.line, {
        width: `${clamp(progress, 0, 1) * 100}%`,
        scaleX: 1,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: true,
      })
    }

    await waitForVideo(item.video, setProgress)

    if (requestId !== item.requestId || activeItem !== item) return

    item.isLoading = false

    item.loadTween?.kill()
    item.loadTween = gsap.to(item.line, {
      width: '100%',
      scaleX: 1,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: true,
      onComplete: () => {
        if (requestId !== item.requestId || activeItem !== item) return

        item.lineTween = gsap.to(item.line, {
          scaleX: 0,
          duration: 0.45,
          ease: 'power3.inOut',
          overwrite: true,
          onComplete: () => {
            item.video.play().catch(() => {})
            syncToggleLabels()
          },
        })
      },
    })
  }

  const handleStoryPointerEnter = (item) => {
    showToggle(item)
  }

  const handleStoryPointerLeave = (item) => {
    hideToggle(item)
  }

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return

    const story = event.target.closest(SELECTORS.story)

    wrapperTween?.kill()
    isDragging = true
    didDrag = false
    dragPointerId = event.pointerId
    pendingTapItem = story ? itemByStory.get(story) : null
    dragStartX = event.clientX
    dragStartY = event.clientY
    dragStartPosition = currentX
    lastDragX = event.clientX
    lastDragTime = performance.now()
    dragVelocity = 0
    container.setPointerCapture?.(dragPointerId)
  }

  const handlePointerMove = (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return

    const deltaX = event.clientX - dragStartX
    const deltaY = event.clientY - dragStartY

    if (!didDrag && Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) return

    if (Math.abs(deltaY) > Math.abs(deltaX)) return

    event.preventDefault()
    didDrag = true
    {
      const now = performance.now()
      const elapsed = Math.max(16, now - lastDragTime)

      dragVelocity = (event.clientX - lastDragX) / elapsed
      lastDragX = event.clientX
      lastDragTime = now
    }
    currentX = clamp(dragStartPosition + deltaX, -maxX, 0)
    setWrapperX(currentX)
  }

  const handlePointerUp = (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return

    isDragging = false
    dragPointerId = null
    container.releasePointerCapture?.(event.pointerId)

    if (didDrag) {
      releaseMomentum()
      window.setTimeout(() => {
        didDrag = false
      }, 0)
    } else if (pendingTapItem) {
      playItem(pendingTapItem)
    }

    pendingTapItem = null
  }

  gsap.set(container, {
    overflow: 'hidden',
    touchAction: 'pan-y',
    cursor: 'grab',
  })

  gsap.set(wrapper, {
    display: 'flex',
    willChange: 'transform',
  })

  gsap.set(items.map(({ line }) => line), {
    width: '0%',
    scaleX: 1,
    transformOrigin: 'right center',
  })

  gsap.set(items.map(({ playToggleParent }) => playToggleParent).filter(Boolean), {
    opacity: 0,
  })

  items.forEach((item) => {
    item.video.pause()
    item.video.preload = 'auto'
    item.video.playsInline = true
    item.video.setAttribute('playsinline', '')
    if (supportsHover) {
      item.onPointerEnter = (event) => handleStoryPointerEnter(item, event)
      item.onPointerLeave = () => handleStoryPointerLeave(item)
      item.story.addEventListener('pointerenter', item.onPointerEnter)
      item.story.addEventListener('pointerleave', item.onPointerLeave)
    }
  })
  syncToggleLabels()

  measure()

  container.addEventListener('pointerdown', handlePointerDown)
  container.addEventListener('pointermove', handlePointerMove)
  container.addEventListener('pointerup', handlePointerUp)
  container.addEventListener('pointercancel', handlePointerUp)
  window.addEventListener('resize', measure)

  return {
    pause: pauseAll,
    destroy: () => {
      wrapperTween?.kill()
      items.forEach((item) => {
        item.requestId += 1
        item.isLoading = false
        item.loadTween?.kill()
        item.lineTween?.kill()
        item.video.pause()
        if (supportsHover) {
          item.story.removeEventListener('pointerenter', item.onPointerEnter)
          item.story.removeEventListener('pointerleave', item.onPointerLeave)
        }
      })
      container.removeEventListener('pointerdown', handlePointerDown)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('resize', measure)
      gsap.set(container, { clearProps: 'overflow,touchAction,cursor' })
      gsap.set(wrapper, { clearProps: 'display,willChange,transform' })
      gsap.set(items.map(({ line }) => line), { clearProps: 'width,scaleX,transformOrigin' })
      gsap.set(items.map(({ playToggleParent }) => playToggleParent).filter(Boolean), { clearProps: 'opacity' })
    },
  }
}
