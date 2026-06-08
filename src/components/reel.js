import gsap from 'gsap'
import { lenis } from './scroll.js'

const SELECTORS = {
  trigger: '[data-c="reel-toggle"]',
  parent: '.reel-parent',
  child: '.reel-child',
  videoParent: '.video-reel-parent',
  video: '.reel-video',
  line: '.reel-load-line',
  timer: '.timer',
  timelineParent: '.video-timeline-parent',
  timeline: '.video-timeline',
  muteToggle: '.mute-toggle',
  playToggle: '.play-toggle',
  fullscreenToggle: '.fullscreen-toggle',
  closeToggle: '.reel-close-toggle',
  togglesParent: '.reel-toggles-parent',
  settings: '.reel-settings',
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
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

export function initReel(root = document) {
  let activeTween = null
  let loadTween = null
  let requestId = 0
  let isOpen = false
  let isLoading = false
  let isScrubbing = false
  let savedLenisScroll = lenis.scroll
  let previousBodyOverflow = ''
  let previousHtmlOverflow = ''
  let activeElements = null
  let progressFrame = null

  const queryElement = (scope, selector) => (
    scope?.querySelector(selector)
    || root.querySelector(selector)
    || document.querySelector(selector)
  )

  const getElements = () => {
    const parent = root.querySelector(SELECTORS.parent) || document.querySelector(SELECTORS.parent)

    if (!parent) return null

    const child = parent.querySelector(SELECTORS.child) || parent
    const videoParent = queryElement(parent, SELECTORS.videoParent) || child
    const video = queryElement(parent, SELECTORS.video)
    const line = queryElement(parent, SELECTORS.line)

    return {
      parent,
      child,
      videoParent,
      video,
      line,
      timer: queryElement(parent, SELECTORS.timer),
      timelineParent: queryElement(parent, SELECTORS.timelineParent),
      timeline: queryElement(parent, SELECTORS.timeline),
      muteToggle: queryElement(parent, SELECTORS.muteToggle),
      playToggle: queryElement(parent, SELECTORS.playToggle),
      fullscreenToggle: queryElement(parent, SELECTORS.fullscreenToggle),
      closeToggle: queryElement(parent, SELECTORS.closeToggle),
      togglesParent: queryElement(parent, SELECTORS.togglesParent),
      settings: queryElement(parent, SELECTORS.settings),
    }
  }

  const lockScroll = () => {
    savedLenisScroll = lenis.scroll
    previousBodyOverflow = document.body.style.overflow
    previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    lenis.stop()
  }

  const unlockScroll = () => {
    lenis.scrollTo(savedLenisScroll, {
      immediate: true,
      force: true,
    })

    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow
    lenis.start()
  }

  const setToggleText = (toggle, textSelector, text) => {
    if (!toggle) return

    const label = toggle.querySelector(textSelector) || toggle

    label.classList.add('label')
    label.textContent = text
  }

  const setPlayLabel = () => {
    const { playToggle, video } = activeElements || {}
    if (!playToggle || !video) return

    setToggleText(playToggle, '[data-a="play-toggle"]', video.paused ? 'play' : 'pause')
  }

  const setMuteLabel = () => {
    const { muteToggle, video } = activeElements || {}
    if (!muteToggle || !video) return

    setToggleText(muteToggle, '[data-a="mute-toggle"]', video.muted ? 'sound' : 'mute')
  }

  const updateProgress = () => {
    const { video, timeline, timer } = activeElements || {}
    if (!video) return

    const progress = video.duration ? clamp(video.currentTime / video.duration, 0, 1) : 0

    if (timeline) {
      gsap.set(timeline, { scaleX: progress })
    }

    if (timer) {
      timer.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`
    }
  }

  const stopProgressLoop = () => {
    if (!progressFrame) return

    cancelAnimationFrame(progressFrame)
    progressFrame = null
  }

  const startProgressLoop = () => {
    stopProgressLoop()

    const tick = () => {
      updateProgress()

      const { video } = activeElements || {}

      if (video && !video.paused && !video.ended) {
        progressFrame = requestAnimationFrame(tick)
        return
      }

      progressFrame = null
    }

    progressFrame = requestAnimationFrame(tick)
  }

  const resetLine = () => {
    const { line } = activeElements || {}
    if (!line) return

    loadTween?.kill()
    loadTween = null

    gsap.set(line, {
      height: '0%',
      yPercent: 0,
    })
  }

  const pause = () => {
    const { video } = activeElements || {}
    if (!video) return

    video.pause()
    setPlayLabel()
  }

  const playWithSound = () => {
    const { video } = activeElements || {}
    if (!video) return

    video.muted = false
    video.volume = 1
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.removeAttribute('muted')
    video.play().then(() => {
      setPlayLabel()
      setMuteLabel()
      startProgressLoop()
    }).catch(() => {
      setPlayLabel()
      setMuteLabel()
    })
  }

  const loadVideo = async () => {
    const { video, line } = activeElements || {}
    if (!video || !line) return Promise.resolve()

    requestId += 1
    const activeRequest = requestId

    isLoading = true
    pause()
    video.muted = false
    video.volume = 1
    video.removeAttribute('muted')
    video.preload = 'auto'
    video.playsInline = true
    video.setAttribute('playsinline', '')
    resetLine()

    const setProgress = (progress) => {
      if (activeRequest !== requestId) return

      loadTween?.kill()
      loadTween = gsap.to(line, {
        height: `${clamp(progress, 0, 1) * 100}%`,
        yPercent: 0,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: true,
      })
    }

    await waitForVideo(video, setProgress)

    if (activeRequest !== requestId) return

    isLoading = false
    loadTween?.kill()

    return new Promise((resolve) => {
      loadTween = gsap.timeline({ onComplete: resolve })
        .to(line, {
          height: '100%',
          yPercent: 0,
          duration: 0.28,
          ease: 'power2.out',
          overwrite: true,
        })
        .to(line, {
          yPercent: -110,
          duration: 0.45,
          ease: 'power3.inOut',
          overwrite: true,
        })
    })
  }

  const openReel = async () => {
    if (isOpen || isLoading) return

    const parent = root.querySelector(SELECTORS.parent) || document.querySelector(SELECTORS.parent)

    if (!parent) return

    parent.style.display = 'block'
    activeElements = getElements()

    if (!activeElements) return

    const { child, videoParent, timeline, video, line, togglesParent, settings, closeToggle } = activeElements

    isOpen = true
    lockScroll()
    resetLine()
    updateProgress()

    activeTween?.kill()
    gsap.set(child, {
      clipPath: 'inset(100% 0% 0% 0%)',
      overflow: 'hidden',
    })
    gsap.set(videoParent, {
      scale: 1.5,
      transformOrigin: 'center center',
    })
    gsap.set(timeline, {
      width: '100%',
      scaleX: 0,
      transformOrigin: 'left center',
      willChange: 'transform',
    })
    gsap.set(togglesParent, {
      clipPath: 'inset(100% 0% 0% 0%)',
      overflow: 'hidden',
    })
    gsap.set(settings, {
      opacity: 0,
    })
    gsap.set(closeToggle, {
      xPercent: -20,
      opacity: 0,
    })

    await loadVideo()

    if (!isOpen || activeElements?.video !== video) return

    activeTween = gsap.timeline()
      .to(child, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.9,
        ease: 'power3.inOut',
        overwrite: true,
      }, 0)
      .to(videoParent, {
        scale: 1,
        duration: 0.9,
        ease: 'power3.inOut',
        overwrite: true,
      }, 0)
      .to(togglesParent, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.75,
        ease: 'power3.inOut',
        overwrite: true,
      }, 0.18)
      .to(settings, {
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: true,
      }, 0.28)
      .to(closeToggle, {
        xPercent: 0,
        opacity: 1,
        duration: 0.55,
        ease: 'power3.out',
        overwrite: true,
      }, 0.72)

    if (video && line) {
      playWithSound()
    }
  }

  const closeReel = () => {
    const { parent, child, videoParent, togglesParent, settings, closeToggle } = activeElements || {}
    if (!isOpen || !parent || !child) return

    requestId += 1
    isLoading = false
    isOpen = false
    pause()
    activeTween?.kill()
    loadTween?.kill()
    stopProgressLoop()

    activeTween = gsap.timeline({
      onComplete: () => {
        parent.style.display = 'none'
        resetLine()
        unlockScroll()
      },
    })
      .to(child, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.65,
        ease: 'power3.inOut',
        overwrite: true,
      }, 0.12)
      .to(videoParent, {
        scale: 1.5,
        duration: 0.65,
        ease: 'power3.inOut',
        overwrite: true,
      }, 0.12)
      .to(togglesParent, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.45,
        ease: 'power3.inOut',
        overwrite: true,
      }, 0)
      .to(settings, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: true,
      }, 0)
      .to(closeToggle, {
        xPercent: -20,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
      }, 0)
  }

  const togglePlay = (event) => {
    event?.stopPropagation()

    const { video } = activeElements || {}

    if (!isOpen) {
      openReel()
      return
    }

    if (!video) return

    if (video.paused) {
      playWithSound()
      return
    }

    pause()
  }

  const toggleMute = (event) => {
    const { video } = activeElements || {}

    event?.stopPropagation()
    if (!video) return

    video.muted = !video.muted
    setMuteLabel()
  }

  const toggleFullscreen = (event) => {
    const { parent } = activeElements || {}

    event?.stopPropagation()
    if (!parent) return

    if (document.fullscreenElement) {
      document.exitFullscreen?.()
      return
    }

    parent.requestFullscreen?.()
  }

  const seekFromEvent = (event) => {
    const { video, timelineParent } = activeElements || {}
    if (!timelineParent || !video?.duration) return

    const rect = timelineParent.getBoundingClientRect()
    const progress = clamp((event.clientX - rect.left) / rect.width, 0, 1)

    video.currentTime = progress * video.duration
    updateProgress()
  }

  const startScrub = (event) => {
    if (!event.target.closest(SELECTORS.timelineParent)) return

    event.stopPropagation()
    isScrubbing = true
    seekFromEvent(event)
    activeElements?.timelineParent?.setPointerCapture?.(event.pointerId)
  }

  const moveScrub = (event) => {
    if (!isScrubbing) return

    event.preventDefault()
    seekFromEvent(event)
  }

  const endScrub = (event) => {
    if (!isScrubbing) return

    isScrubbing = false
    activeElements?.timelineParent?.releasePointerCapture?.(event.pointerId)
  }

  const handleClick = (event) => {
    if (event.target.closest(SELECTORS.trigger)) {
      console.log('clicked link')
      event.preventDefault()
      openReel()
      return
    }

    if (event.target.closest(SELECTORS.closeToggle)) {
      closeReel()
      return
    }

    if (event.target.closest(SELECTORS.playToggle)) {
      togglePlay(event)
      return
    }

    if (event.target.closest(SELECTORS.muteToggle)) {
      toggleMute(event)
      return
    }

    if (event.target.closest(SELECTORS.fullscreenToggle)) {
      toggleFullscreen(event)
    }
  }

  const handleTimeUpdate = () => updateProgress()
  const handleMetadata = () => updateProgress()
  const handlePlay = () => {
    setPlayLabel()
    startProgressLoop()
  }
  const handlePause = () => {
    setPlayLabel()
    stopProgressLoop()
    updateProgress()
  }
  const handleVolume = () => setMuteLabel()

  const initialParent = root.querySelector(SELECTORS.parent) || document.querySelector(SELECTORS.parent)
  const initialVideo = queryElement(initialParent, SELECTORS.video)

  if (initialParent && getComputedStyle(initialParent).display === 'none') {
    initialParent.style.display = 'none'
  }

  initialVideo?.addEventListener('timeupdate', handleTimeUpdate)
  initialVideo?.addEventListener('loadedmetadata', handleMetadata)
  initialVideo?.addEventListener('play', handlePlay)
  initialVideo?.addEventListener('pause', handlePause)
  initialVideo?.addEventListener('volumechange', handleVolume)
  document.addEventListener('click', handleClick)
  document.addEventListener('pointerdown', startScrub)
  document.addEventListener('pointermove', moveScrub)
  document.addEventListener('pointerup', endScrub)
  document.addEventListener('pointercancel', endScrub)

  return {
    pause,
    destroy: () => {
      const { line, child, videoParent, timeline, togglesParent, settings } = activeElements || {}

      requestId += 1
      isLoading = false
      activeTween?.kill()
      loadTween?.kill()
      stopProgressLoop()
      pause()

      if (isOpen) {
        unlockScroll()
      }

      initialVideo?.removeEventListener('timeupdate', handleTimeUpdate)
      initialVideo?.removeEventListener('loadedmetadata', handleMetadata)
      initialVideo?.removeEventListener('play', handlePlay)
      initialVideo?.removeEventListener('pause', handlePause)
      initialVideo?.removeEventListener('volumechange', handleVolume)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('pointerdown', startScrub)
      document.removeEventListener('pointermove', moveScrub)
      document.removeEventListener('pointerup', endScrub)
      document.removeEventListener('pointercancel', endScrub)
      if (line) gsap.set(line, { clearProps: 'height,transform' })
      if (child) gsap.set(child, { clearProps: 'clipPath,overflow' })
      if (videoParent) gsap.set(videoParent, { clearProps: 'transform,transformOrigin' })
      if (timeline) gsap.set(timeline, { clearProps: 'transform,transformOrigin' })
      if (togglesParent) gsap.set(togglesParent, { clearProps: 'clipPath,overflow' })
      if (settings) gsap.set(settings, { clearProps: 'opacity' })
    },
  }
}
