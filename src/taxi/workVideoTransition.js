import gsap from 'gsap'

const SELECTORS = {
  contentItem: '.work-content-item',
  line: '.line-video-load',
  lineParent: '[data-a="line-parent"]',
  videoParent: '.work-video-parent',
  video: '.main-workp-video',
}

let transitionLine = null
let transitionLineParent = null
let transitionLineTween = null

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

function destroyTransitionLine() {
  transitionLineTween?.kill()
  transitionLineTween = null
  transitionLine = null
  transitionLineParent = null
}

function removeOldContent(wrapper, currentContent) {
  if (!wrapper || !currentContent) return

  Array.from(wrapper.children).forEach((child) => {
    if (child !== currentContent) {
      child.remove()
    }
  })
}

function createTransitionOverlay(to) {
  const overlay = document.createElement('div')

  overlay.setAttribute('aria-hidden', 'true')
  overlay.dataset.workTransitionOverlay = ''
  to.appendChild(overlay)

  gsap.set(overlay, {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#000',
    opacity: 0,
    zIndex: 11,
    pointerEvents: 'none',
  })

  return overlay
}

function getBufferedProgress(video) {
  if (!video.duration || !Number.isFinite(video.duration) || video.buffered.length === 0) {
    return 0
  }

  return video.buffered.end(video.buffered.length - 1) / video.duration
}

function waitForVideo(video) {
  return new Promise((resolve) => {
    let timeout = null

    const complete = () => {
      cleanup()
      setLineProgress(1)
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

function startVideo(video) {
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

  playPromise.catch(() => {
    video.muted = true
    video.setAttribute('muted', '')
    video.play().catch(() => {})

    const unlockSound = () => {
      video.muted = false
      video.removeAttribute('muted')
      video.play().catch(() => {})
      window.removeEventListener('pointerdown', unlockSound)
    }

    window.addEventListener('pointerdown', unlockSound, { once: true })
  })
}

function getActiveContentItem(from) {
  const contentItems = gsap.utils.toArray(SELECTORS.contentItem, from)

  return contentItems.find((item) => {
    const opacity = Number(gsap.getProperty(item, 'opacity'))
    const visibility = gsap.getProperty(item, 'visibility')

    return opacity > 0.5 && visibility !== 'hidden'
  }) || contentItems[0] || from
}

export function startWorkVideoLeave(from) {
  const activeContentItem = getActiveContentItem(from)

  transitionLine = activeContentItem.querySelector(SELECTORS.line)
  transitionLineParent = transitionLine?.closest(SELECTORS.lineParent)

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
  const videoParent = to.querySelector(SELECTORS.videoParent)
  const video = to.querySelector(SELECTORS.video)

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
    zIndex: 11,
  })

  const overlay = createTransitionOverlay(to)

  gsap.set(videoParent, {
    position: 'absolute',
    inset: 0,
    zIndex: 12,
    clipPath: 'inset(100% 0 0 0)',
    overflow: 'hidden',
    willChange: 'clip-path',
  })

  startVideo(video)
  await waitForVideo(video)
  startVideo(video)

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    onComplete: () => {
      gsap.set(videoParent, { clearProps: 'position,inset,zIndex,willChange' })
      overlay.remove()
      destroyTransitionLine()
      removeOldContent(wrapper, to)
      gsap.set(to, { clearProps: 'position,inset,width,height,overflow,zIndex' })
      done()
    },
  })

  if (transitionLine) {
    tl.to(transitionLine, {
      width: '100%',
      duration: 0.25,
      ease: 'power2.out',
    }, 0)
  }

  if (transitionLineParent) {
    tl.to(transitionLineParent, {
      scaleX: 0,
      duration: 0.65,
      ease: 'power3.inOut',
    }, 0.25)
  }

  tl.to(overlay, {
    opacity: 0.7,
    duration: 0.65,
    ease: 'power2.out',
  }, 0.25)

  tl.to(videoParent, {
    clipPath: 'inset(0% 0 0 0)',
    duration: 1.05,
  }, 0.2)
}
