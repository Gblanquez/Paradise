import gsap from 'gsap'
import { initInfoCarrousel } from './infoCarrousel.js'
import { initInfoVideo } from './infoVideo.js'
import { lenis } from './scroll.js'
import { initVerticalVideos } from './verticalVideos.js'

const SELECTORS = {
  container: '.info-container',
  openToggle: '.info-toggle',
  closeToggle: '.close-info-toggle',
  video: '.main-workp-video',
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

export function initInfoProjects(root = document) {
  const container = root.querySelector(SELECTORS.container)
  const openToggle = root.querySelector(SELECTORS.openToggle)
  const closeToggle = root.querySelector(SELECTORS.closeToggle)
  const videos = gsap.utils.toArray(SELECTORS.video, root)
  const video = videos.find(isVisible) || videos.find(matchesCurrentViewport) || videos[0]

  if (!container || !openToggle || !closeToggle) return () => {}

  let activeTween = null
  let isOpen = !container.classList.contains('hide')
  let wasVideoPaused = video?.paused ?? true
  let destroyInfoCarrousel = null
  let infoVideo = null
  let verticalVideos = null

  const pauseVideo = () => {
    if (!video) return

    wasVideoPaused = video.paused
    video.pause()
  }

  const resumeVideo = () => {
    if (!video || wasVideoPaused) return

    video.play().catch(() => {})
  }

  const openInfo = () => {
    activeTween?.kill()
    isOpen = true
    container.classList.remove('hide')
    lenis.stop()
    pauseVideo()

    if (!destroyInfoCarrousel) {
      destroyInfoCarrousel = initInfoCarrousel(container)
    }

    if (!verticalVideos) {
      verticalVideos = initVerticalVideos(container)
    }

    if (!infoVideo) {
      infoVideo = initInfoVideo(container)
    }

    activeTween = gsap.fromTo(container,
      { x: '100%' },
      {
        x: '0%',
        duration: 0.8,
        ease: 'power3.inOut',
        overwrite: true,
      }
    )
  }

  const closeInfo = () => {
    activeTween?.kill()
    isOpen = false
    destroyInfoCarrousel?.()
    destroyInfoCarrousel = null
    verticalVideos?.pause()
    infoVideo?.pause()

    activeTween = gsap.to(container, {
      x: '100%',
      duration: 0.45,
      ease: 'power3.in',
      overwrite: true,
      onComplete: () => {
        container.classList.add('hide')
        resumeVideo()
        lenis.start()
      },
    })
  }

  const onOpenClick = () => {
    if (isOpen) return

    openInfo()
  }

  const onCloseClick = () => {
    if (!isOpen && container.classList.contains('hide')) return

    closeInfo()
  }

  const handleWheel = (event) => {
    event.stopPropagation()

    if (!isOpen) return

    event.preventDefault()
    container.scrollTop += event.deltaY
  }

  const stopScrollPropagation = (event) => {
    event.stopPropagation()
  }

  openToggle.addEventListener('click', onOpenClick)
  closeToggle.addEventListener('click', onCloseClick)
  container.addEventListener('wheel', handleWheel, { passive: false })
  container.addEventListener('touchmove', stopScrollPropagation, { passive: true })

  gsap.set(container, {
    height: '100dvh',
    maxHeight: '100dvh',
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
  })
  container.style.setProperty('-webkit-overflow-scrolling', 'touch')

  return () => {
    activeTween?.kill()
    lenis.start()
    resumeVideo()
    destroyInfoCarrousel?.()
    destroyInfoCarrousel = null
    infoVideo?.destroy()
    infoVideo = null
    verticalVideos?.destroy()
    verticalVideos = null
    openToggle.removeEventListener('click', onOpenClick)
    closeToggle.removeEventListener('click', onCloseClick)
    container.removeEventListener('wheel', handleWheel)
    container.removeEventListener('touchmove', stopScrollPropagation)
    container.style.removeProperty('-webkit-overflow-scrolling')
    gsap.set(container, { clearProps: 'transform,height,maxHeight,overflowY,overflowX,overscrollBehavior' })
  }
}
