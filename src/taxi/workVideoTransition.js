import gsap from 'gsap'
import { removeOldContent } from './removeOldContent.js'

const SELECTORS = {
  contentItem: '.work-content-item',
  line: '.line-video-load',
  lineParent: '[data-a="line-parent"]',
  videoParent: '.work-video-parent',
  videoScaleParent: '.video-parent',
  video: '.main-workp-video',
  revealUi: '.work-title-parent, .work-settings, .work-toggles-parent',
  overlay: '.overlay',
}

let transitionLine = null
let transitionLineParent = null
let transitionLineTween = null
let transitionOverlay = null

function setLineProgress(progress) {
  if (!transitionLine) return

  gsap.to(transitionLine, {
    width: `${gsap.utils.clamp(0, 1, progress) * 100}%`,
    scaleX: 1,
    duration: 0.35,
    ease: 'power2.out',
    overwrite: true,
  })
}

function finishLineProgress() {
  transitionLineTween?.kill()
  transitionLineTween = null

  if (!transitionLine) return Promise.resolve()

  return new Promise((resolve) => {
    gsap.to(transitionLine, {
      width: '100%',
      scaleX: 1,
      duration: 0.45,
      ease: 'power2.out',
      overwrite: true,
      onComplete: resolve,
    })
  })
}

function destroyTransitionLine() {
  transitionLineTween?.kill()
  transitionLineTween = null
  transitionLine = null
  transitionLineParent = null
  transitionOverlay = null
}

function getBufferedProgress(video) {
  if (!video.duration || !Number.isFinite(video.duration) || video.buffered.length === 0) {
    return 0
  }

  return video.buffered.end(video.buffered.length - 1) / video.duration
}

function isVisible(element) {
  return element && matchesCurrentViewport(element) && element.getClientRects().length > 0 && getComputedStyle(element).display !== 'none'
}

function isMobileViewport() {
  return window.innerWidth <= 480
}

function matchesCurrentViewport(element) {
  if (!element) return false

  const isMobile = isMobileViewport()

  if (isMobile && element.closest('.mob-hide')) return false
  if (!isMobile && element.closest('.desktop-hide')) return false

  return true
}

function getVisibleElement(selector, root) {
  const elements = gsap.utils.toArray(selector, root)

  return elements.find(isVisible) || elements.find(matchesCurrentViewport) || elements[0] || null
}

function waitForVideo(video) {
  return new Promise((resolve) => {
    let timeout = null

    const complete = () => {
      cleanup()
      resolve()
    }

    const updateProgress = () => {
      setLineProgress(Math.max(0.2, getBufferedProgress(video) * 0.95))
    }

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', updateProgress)
      video.removeEventListener('progress', updateProgress)
      video.removeEventListener('canplay', complete)
      video.removeEventListener('canplaythrough', complete)
      video.removeEventListener('loadeddata', updateProgress)
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

    video.addEventListener('loadedmetadata', updateProgress)
    video.addEventListener('progress', updateProgress)
    video.addEventListener('loadeddata', updateProgress)
    video.addEventListener('canplay', complete, { once: true })
    video.addEventListener('canplaythrough', complete, { once: true })
    video.addEventListener('error', complete, { once: true })

    video.load()
    updateProgress()
  })
}

async function startVideo(video) {
  video.loop = true
  video.autoplay = true
  video.muted = false
  video.volume = 1
  video.playsInline = true
  video.setAttribute('autoplay', '')
  video.setAttribute('playsinline', '')
  video.removeAttribute('muted')

  const playPromise = video.play()

  if (!playPromise) return

  return playPromise.catch(async () => {
    video.muted = true
    video.setAttribute('muted', '')
    await video.play().catch(() => {})

    const unlockSound = () => {
      video.muted = false
      video.removeAttribute('muted')
      video.play().catch(() => {})
      window.removeEventListener('pointerdown', unlockSound)
    }

    window.addEventListener('pointerdown', unlockSound, { once: true })
  })
}

function prepareVideo(video) {
  video.loop = true
  video.autoplay = true
  video.muted = false
  video.volume = 1
  video.playsInline = true
  video.preload = 'auto'
  video.setAttribute('autoplay', '')
  video.setAttribute('playsinline', '')
  video.removeAttribute('muted')
  video.load()
}

function getActiveContentItem(from) {
  const contentItems = gsap.utils.toArray(SELECTORS.contentItem, from).filter(matchesCurrentViewport)

  return contentItems.find((item) => {
    const opacity = Number(gsap.getProperty(item, 'opacity'))
    const visibility = gsap.getProperty(item, 'visibility')

    return opacity > 0.5 && visibility !== 'hidden'
  }) || contentItems.find(isVisible) || contentItems[0] || getVisibleElement(SELECTORS.contentItem, from) || from
}

function getTransitionLine(from) {
  const activeContentItem = getActiveContentItem(from)
  const scopedLine = getVisibleElement(SELECTORS.line, activeContentItem)

  return scopedLine || getVisibleElement(SELECTORS.line, from)
}

export function startWorkVideoLeave(from) {
  transitionLine = getTransitionLine(from)
  transitionLineParent = transitionLine?.closest(SELECTORS.lineParent)
  transitionOverlay = getVisibleElement(SELECTORS.overlay, from)

  if (transitionOverlay) {
    gsap.set(transitionOverlay, {
      opacity: 0,
      pointerEvents: 'none',
    })
  }

  if (!transitionLine) return

  gsap.set(transitionLine, {
    width: '0%',
  })

  if (transitionLineParent) {
    gsap.set(transitionLineParent, {
      scaleX: 1,
      transformOrigin: 'right center',
    })
  }

  transitionLineTween = gsap.to(transitionLine, {
    width: '82%',
    duration: 1.2,
    ease: 'power2.out',
  })
}

export async function enterWorkVideo({ to, wrapper, done }) {
  const videoParent = getVisibleElement(SELECTORS.videoParent, to)
  const videoScaleParent = videoParent?.querySelector(SELECTORS.videoScaleParent) || getVisibleElement(SELECTORS.videoScaleParent, to)
  const video = videoParent?.querySelector(SELECTORS.video) || getVisibleElement(SELECTORS.video, to)
  const revealUi = gsap.utils.toArray(SELECTORS.revealUi, to).filter(matchesCurrentViewport)
  const incomingOverlays = gsap.utils.toArray(SELECTORS.overlay, to)

  if (!videoParent || !video) {
    destroyTransitionLine()
    removeOldContent(wrapper, to)
    done()
    return
  }

  gsap.set(to, {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100dvh',
    overflow: 'hidden',
    zIndex: 102,
  })

  gsap.set(revealUi, {
    opacity: 0,
  })

  gsap.set(incomingOverlays, {
    opacity: 0,
    pointerEvents: 'none',
  })

  gsap.set(videoParent, {
    position: 'absolute',
    inset: 0,
    zIndex: 103,
    pointerEvents: 'none',
    clipPath: 'inset(100% 0 0 0)',
    scale: 0.8,
    overflow: 'hidden',
    willChange: 'clip-path, transform',
  })

  if (videoScaleParent) {
    gsap.set(videoScaleParent, {
      scale: 1.5,
      willChange: 'transform',
    })
  }

  prepareVideo(video)
  await waitForVideo(video)
  await finishLineProgress()
  await startVideo(video)

  if (transitionOverlay) {
    gsap.set(transitionOverlay, {
      opacity: 0,
    })
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    onComplete: () => {
      gsap.set(videoParent, { clearProps: 'position,inset,zIndex,willChange' })
      destroyTransitionLine()
      removeOldContent(wrapper, to)
      gsap.set(to, { clearProps: 'position,inset,width,height,overflow,zIndex' })
      done()
    },
  })

  if (transitionLineParent) {
    tl.to(transitionLineParent, {
      scaleX: 0,
      duration: 0.65,
      ease: 'power3.inOut',
    }, 0)
  }

  tl.to(videoParent, {
    clipPath: 'inset(0% 0 0 0)',
    scale: 1,
    duration: 1.05,
  }, 0.2)

  if (videoScaleParent) {
    tl.to(videoScaleParent, {
      scale: 1,
      duration: 1.05,
    }, 0.2)
  }

  if (revealUi.length) {
    tl.to(revealUi, {
      opacity: 1,
      duration: 0.55,
      ease: 'power2.out',
      stagger: 0.04,
    }, 0.9)
  }
}
