import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { canUseHover } from './hoverSupport.js'
import { afterInitialLoad } from './load.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  video: '.info-video',
  videoContainer: '.info-video-container',
  line: '.info-load-line',
  playToggleParent: '.play-toggle-parent',
  playToggle: '[data-c="play-toggle"]',
  mobileArrow: '.mob-arrow-showcase',
}

const VIDEO_MASK_RADIUS = '0.8rem'
const VIDEO_MASK_CLIP = 'inset(var(--mask-y) var(--mask-x) var(--mask-y) var(--mask-x) round var(--mask-radius))'

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

function getVideoScope(video, root) {
  let element = video.parentElement

  while (element && element !== root && element !== document.body) {
    if (element.querySelector(SELECTORS.videoContainer) || element.querySelector(SELECTORS.video)) {
      return element
    }

    element = element.parentElement
  }

  return video.parentElement || root
}

function createInfoVideo(video, root, pauseOthers) {
  const supportsHover = canUseHover()
  const scope = getVideoScope(video, root)
  const videoContainer = video.closest(SELECTORS.videoContainer) || scope?.querySelector(SELECTORS.videoContainer)
  const line = scope?.querySelector(SELECTORS.line)
  const playToggleParent = scope?.querySelector(SELECTORS.playToggleParent)
  const playToggle = scope?.querySelector(SELECTORS.playToggle)
  const mobileArrow = scope?.querySelector(SELECTORS.mobileArrow)

  if (!scope) return null

  let loadTween = null
  let lineTween = null
  let revealTween = null
  let isDestroyed = false
  let requestId = 0
  let isLoading = false

  const setToggleLabel = (label) => {
    if (!playToggle) return

    playToggle.textContent = label
  }

  const syncToggleLabel = () => {
    setToggleLabel(video.paused ? 'play' : 'pause')
  }

  const showToggle = () => {
    if (!playToggleParent) return

    gsap.to(playToggleParent, {
      opacity: 1,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  const hideToggle = () => {
    if (!playToggleParent) return

    gsap.to(playToggleParent, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  const hideMobileArrow = () => {
    if (supportsHover || !mobileArrow) return

    gsap.to(mobileArrow, {
      autoAlpha: 0,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  const showMobileArrow = () => {
    if (supportsHover || !mobileArrow) return

    gsap.to(mobileArrow, {
      autoAlpha: 1,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  const resetLine = () => {
    loadTween?.kill()
    lineTween?.kill()
    loadTween = null
    lineTween = null

    gsap.set(line, {
      width: '0%',
      scaleX: 1,
      transformOrigin: 'right center',
    })
  }

  const pause = () => {
    requestId += 1
    isLoading = false
    video.pause()
    showMobileArrow()
    syncToggleLabel()
  }

  const autoplay = () => {
    if (!video.autoplay && !video.hasAttribute('autoplay')) return

    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.play().catch(() => {})
  }

  const playWithSound = () => {
    video.muted = false
    video.volume = 1
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.removeAttribute('muted')
    video.play().then(syncToggleLabel).catch(syncToggleLabel)
  }

  const loadAndPlay = async () => {
    requestId += 1
    const activeRequest = requestId

    pauseOthers(video)
    isLoading = true
    video.pause()
    video.preload = 'auto'
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.muted = false
    video.volume = 1
    video.removeAttribute('muted')
    resetLine()

    const setProgress = (progress) => {
      if (activeRequest !== requestId) return

      loadTween?.kill()
      loadTween = gsap.to(line, {
        width: `${clamp(progress, 0, 1) * 100}%`,
        scaleX: 1,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: true,
      })
    }

    await waitForVideo(video, setProgress)

    if (activeRequest !== requestId) return

    isLoading = false
    loadTween?.kill()
    loadTween = gsap.to(line, {
      width: '100%',
      scaleX: 1,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: true,
      onComplete: () => {
        if (activeRequest !== requestId) return

        lineTween = gsap.to(line, {
          scaleX: 0,
          duration: 0.45,
          ease: 'power3.inOut',
          overwrite: true,
          onComplete: playWithSound,
        })
      },
    })
  }

  const handleClick = () => {
    hideMobileArrow()

    if (isLoading) {
      pause()
      resetLine()
      return
    }

    if (!video.paused) {
      pause()
      return
    }

    loadAndPlay()
  }

  video.playsInline = true
  video.setAttribute('playsinline', '')
  if (line) {
    resetLine()
  }

  if (playToggleParent) {
    gsap.set(playToggleParent, {
      opacity: 0,
    })
  }

  if (videoContainer) {
    gsap.set(videoContainer, {
      overflow: 'hidden',
      '--mask-x': '50%',
      '--mask-y': '50%',
      '--mask-radius': VIDEO_MASK_RADIUS,
      scale: 1.2,
      rotation: -20,
      clipPath: VIDEO_MASK_CLIP,
      transformOrigin: 'center center',
      willChange: 'clip-path, transform',
    })

    afterInitialLoad(() => {
      window.requestAnimationFrame(() => {
        if (isDestroyed || revealTween) return

        revealTween = gsap.to(videoContainer, {
          '--mask-x': '0%',
          '--mask-y': '0%',
          '--mask-radius': '0rem',
          scale: 1,
          rotation: 0,
          duration: 1.4,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: videoContainer,
            start: 'top bottom',
            once: true,
          },
        })

        ScrollTrigger.refresh()
      })
    })
  }

  afterInitialLoad(() => {
    window.requestAnimationFrame(() => {
      if (isDestroyed) return

      autoplay()
    })
  })

  return {
    video,
    pause,
    destroy: () => {
      isDestroyed = true
      pause()
      loadTween?.kill()
      lineTween?.kill()
      revealTween?.scrollTrigger?.kill()
      revealTween?.kill()
      if (line) {
        gsap.set(line, { clearProps: 'width,scaleX,transformOrigin' })
      }
      if (playToggleParent) {
        gsap.set(playToggleParent, { clearProps: 'opacity' })
      }
      if (mobileArrow) {
        gsap.set(mobileArrow, { clearProps: 'opacity,visibility' })
      }
      if (videoContainer) {
        gsap.set(videoContainer, { clearProps: 'overflow,clipPath,transform,transformOrigin,willChange,--mask-x,--mask-y,--mask-radius' })
      }
    },
  }
}

export function initInfoVideo(root = document) {
  const videos = gsap.utils.toArray(SELECTORS.video, root)
  const players = []

  const pauseOthers = (activeVideo) => {
    players.forEach((player) => {
      if (player.video !== activeVideo) {
        player.pause()
      }
    })
  }

  videos.forEach((video) => {
    const player = createInfoVideo(video, root, pauseOthers)

    if (player) {
      players.push(player)
    }
  })

  return {
    pause: () => {
      players.forEach((player) => player.pause())
    },
    destroy: () => {
      players.forEach((player) => player.destroy())
      players.length = 0
    },
  }
}
