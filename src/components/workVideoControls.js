import gsap from 'gsap'

const SELECTORS = {
  video: '.main-workp-video',
  timelineParent: '.video-timeline-parent',
  timeline: '.video-timeline',
  muteToggle: '.mute-toggle',
  fullscreenToggle: '.fullscreen-toggle',
  timer: '.timer',
  currentTime: '[data-a="video-current"]',
  duration: '[data-a="video-duration"]',
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

function setPressed(element, isPressed) {
  if (!element) return

  element.setAttribute('aria-pressed', String(isPressed))
  element.classList.toggle('is-active', isPressed)
}

function isVisible(element) {
  return element && element.getClientRects().length > 0 && getComputedStyle(element).display !== 'none'
}

export function initWorkVideoControls(root = document) {
  const videos = gsap.utils.toArray(SELECTORS.video, root)
  const video = videos.find(isVisible) || videos[0]

  if (!video) return () => {}

  const timelineParent = root.querySelector(SELECTORS.timelineParent)
  const timeline = root.querySelector(SELECTORS.timeline)
  const muteToggle = root.querySelector(SELECTORS.muteToggle)
  const fullscreenToggle = root.querySelector(SELECTORS.fullscreenToggle)
  const timer = root.querySelector(SELECTORS.timer)
  const currentTime = root.querySelector(SELECTORS.currentTime)
  const duration = root.querySelector(SELECTORS.duration)
  const setTimelineScale = timeline ? gsap.quickSetter(timeline, 'scaleX') : () => {}
  let rafId = null
  let isSeeking = false

  const updateTimeline = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    const progress = duration > 0 ? video.currentTime / duration : 0

    setTimelineScale(gsap.utils.clamp(0, 1, progress))

    if (timelineParent) {
      timelineParent.setAttribute('aria-valuenow', String(Math.round(progress * 100)))
      timelineParent.setAttribute('aria-valuetext', `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`)
    }
  }

  const updateTimer = () => {
    const current = formatTime(video.currentTime)
    const total = formatTime(video.duration)

    if (timer) {
      timer.textContent = `${current} / ${total}`
    }

    if (currentTime) {
      currentTime.textContent = current
    }

    if (duration) {
      duration.textContent = total
    }
  }

  const updateMuteState = () => {
    setPressed(muteToggle, !video.muted)
  }

  const updateFullscreenState = () => {
    setPressed(fullscreenToggle, document.fullscreenElement === video || document.fullscreenElement === video.parentElement)
  }

  const sync = () => {
    updateTimeline()
    updateTimer()
    rafId = requestAnimationFrame(sync)
  }

  const seekToPointer = (event) => {
    const duration = Number.isFinite(video.duration) ? video.duration : 0

    if (!timelineParent || duration <= 0) return

    const bounds = timelineParent.getBoundingClientRect()

    if (!bounds.width) return

    const progress = (event.clientX - bounds.left) / bounds.width

    video.currentTime = gsap.utils.clamp(0, 1, progress) * duration
    updateTimeline()
    updateTimer()
  }

  const startSeeking = (event) => {
    isSeeking = true
    timelineParent?.setPointerCapture?.(event.pointerId)
    seekToPointer(event)
  }

  const moveSeeking = (event) => {
    if (!isSeeking) return

    seekToPointer(event)
  }

  const stopSeeking = (event) => {
    if (!isSeeking) return

    isSeeking = false
    timelineParent?.releasePointerCapture?.(event.pointerId)
  }

  const toggleMute = () => {
    video.muted = !video.muted

    if (!video.muted) {
      video.volume = 1
      video.removeAttribute('muted')
    } else {
      video.setAttribute('muted', '')
    }

    updateMuteState()
  }

  const toggleFullscreen = () => {
    const fullscreenTarget = video.parentElement || video

    if (document.fullscreenElement) {
      document.exitFullscreen?.()
      return
    }

    fullscreenTarget.requestFullscreen?.()
  }

  gsap.set(timeline, {
    width: '100%',
    scaleX: 0,
    transformOrigin: 'left center',
  })

  if (timelineParent) {
    timelineParent.setAttribute('role', 'slider')
    timelineParent.setAttribute('aria-valuemin', '0')
    timelineParent.setAttribute('aria-valuemax', '100')
    timelineParent.setAttribute('tabindex', '0')
  }

  updateTimeline()
  updateTimer()
  updateMuteState()
  updateFullscreenState()
  rafId = requestAnimationFrame(sync)

  video.addEventListener('play', updateTimeline)
  video.addEventListener('pause', updateTimeline)
  video.addEventListener('seeking', updateTimeline)
  video.addEventListener('seeked', updateTimeline)
  video.addEventListener('durationchange', updateTimer)
  video.addEventListener('loadedmetadata', updateTimer)
  video.addEventListener('volumechange', updateMuteState)
  document.addEventListener('fullscreenchange', updateFullscreenState)
  timelineParent?.addEventListener('pointerdown', startSeeking)
  timelineParent?.addEventListener('pointermove', moveSeeking)
  timelineParent?.addEventListener('pointerup', stopSeeking)
  timelineParent?.addEventListener('pointercancel', stopSeeking)
  muteToggle?.addEventListener('click', toggleMute)
  fullscreenToggle?.addEventListener('click', toggleFullscreen)

  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }

    video.removeEventListener('play', updateTimeline)
    video.removeEventListener('pause', updateTimeline)
    video.removeEventListener('seeking', updateTimeline)
    video.removeEventListener('seeked', updateTimeline)
    video.removeEventListener('durationchange', updateTimer)
    video.removeEventListener('loadedmetadata', updateTimer)
    video.removeEventListener('volumechange', updateMuteState)
    document.removeEventListener('fullscreenchange', updateFullscreenState)
    timelineParent?.removeEventListener('pointerdown', startSeeking)
    timelineParent?.removeEventListener('pointermove', moveSeeking)
    timelineParent?.removeEventListener('pointerup', stopSeeking)
    timelineParent?.removeEventListener('pointercancel', stopSeeking)
    muteToggle?.removeEventListener('click', toggleMute)
    fullscreenToggle?.removeEventListener('click', toggleFullscreen)
    gsap.set(timeline, { clearProps: 'width,scaleX,transformOrigin' })

    if (timelineParent) {
      timelineParent.removeAttribute('role')
      timelineParent.removeAttribute('aria-valuemin')
      timelineParent.removeAttribute('aria-valuemax')
      timelineParent.removeAttribute('aria-valuenow')
      timelineParent.removeAttribute('aria-valuetext')
      timelineParent.removeAttribute('tabindex')
    }
  }
}
