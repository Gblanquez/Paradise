import gsap from 'gsap'
import { lenis } from './scroll.js'

const SELECTORS = {
  container: '.about-container',
  openToggle: '[data-a="about-toggle"]',
  closeToggle: '.close-about-toggle',
  video: 'video',
}

export function initAboutSection(root = document) {
  const container = root.querySelector(SELECTORS.container)
  const openToggles = gsap.utils.toArray(SELECTORS.openToggle, root)
  const closeToggles = gsap.utils.toArray(SELECTORS.closeToggle, root)
  const videos = gsap.utils.toArray(SELECTORS.video, root)

  if (!container || !openToggles.length || !closeToggles.length) return () => {}

  let activeTween = null
  let isOpen = !container.classList.contains('hide')
  let pausedVideos = []
  let savedLenisScroll = lenis.scroll
  let previousBodyOverflow = ''
  let previousHtmlOverflow = ''
  let isPageScrollLocked = false

  const lockPageScroll = () => {
    if (isPageScrollLocked) return

    savedLenisScroll = lenis.scroll
    previousBodyOverflow = document.body.style.overflow
    previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    lenis.stop()
    isPageScrollLocked = true
  }

  const unlockPageScroll = () => {
    if (!isPageScrollLocked) return

    lenis.scrollTo(savedLenisScroll, {
      immediate: true,
      force: true,
    })

    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow
    lenis.start()
    isPageScrollLocked = false
  }

  const pauseVideos = () => {
    pausedVideos = videos.filter((video) => !video.paused)
    pausedVideos.forEach((video) => video.pause())
  }

  const resumeVideos = () => {
    pausedVideos.forEach((video) => video.play().catch(() => {}))
    pausedVideos = []
  }

  const openAbout = () => {
    if (isOpen) return

    activeTween?.kill()
    isOpen = true
    container.classList.remove('hide')
    container.scrollTop = 0
    lockPageScroll()
    pauseVideos()

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

  const closeAbout = () => {
    if (!isOpen && container.classList.contains('hide')) return

    activeTween?.kill()
    isOpen = false

    activeTween = gsap.to(container, {
      x: '100%',
      duration: 0.45,
      ease: 'power3.in',
      overwrite: true,
      onComplete: () => {
        container.classList.add('hide')
        resumeVideos()
        unlockPageScroll()
      },
    })
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

  openToggles.forEach((toggle) => toggle.addEventListener('click', openAbout))
  closeToggles.forEach((toggle) => toggle.addEventListener('click', closeAbout))
  container.addEventListener('wheel', handleWheel, { passive: false })
  container.addEventListener('touchmove', stopScrollPropagation, { passive: true })

  gsap.set(container, {
    position: 'fixed',
    inset: 0,
    height: '100dvh',
    maxHeight: '100dvh',
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
    zIndex: 999,
  })
  container.style.setProperty('-webkit-overflow-scrolling', 'touch')

  return () => {
    activeTween?.kill()
    unlockPageScroll()
    resumeVideos()
    openToggles.forEach((toggle) => toggle.removeEventListener('click', openAbout))
    closeToggles.forEach((toggle) => toggle.removeEventListener('click', closeAbout))
    container.removeEventListener('wheel', handleWheel)
    container.removeEventListener('touchmove', stopScrollPropagation)
    container.style.removeProperty('-webkit-overflow-scrolling')
    gsap.set(container, {
      clearProps: 'transform,position,inset,height,maxHeight,overflowY,overflowX,overscrollBehavior,zIndex',
    })
  }
}
