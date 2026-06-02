import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  section: '#hero',
  trigger: '[data-a="hero-trigger"]',
  videoMask: '[data-a="video-mask"]',
  videoParent: '.reel-emb',
  video: '.reel-vdeo',
  move: '[data-a="hero-move"]',
}

function playVideo(video) {
  if (!video) return

  video.play?.().catch(() => {})
}

export function initHeroSection(root = document, options = {}) {
  const trigger = root.querySelector(SELECTORS.trigger)
  const videoMasks = gsap.utils.toArray(SELECTORS.videoMask, root)
  const moveItems = gsap.utils.toArray(SELECTORS.move, root)
  const videoParents = gsap.utils.toArray(SELECTORS.videoParent, root)
  const videos = videoMasks
    .map((mask) => mask.querySelector(SELECTORS.video) || root.querySelector(SELECTORS.video))
    .filter(Boolean)

  let isAlive = true
  let didRevealReady = false
  const revealReady = () => {
    if (!isAlive || didRevealReady) return

    didRevealReady = true
    options.onRevealReady?.()
  }

  if (!trigger && !videoMasks.length && !moveItems.length) {
    requestAnimationFrame(revealReady)

    return () => {
      isAlive = false
    }
  }

  const revealTimelines = videoMasks.map((mask) => {
    const video = mask.querySelector(SELECTORS.video) || root.querySelector(SELECTORS.video)

    gsap.set(mask, {
      scale: 1.2,
      rotation: -20,
      clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
      transformOrigin: 'center center',
      willChange: 'clip-path, transform',
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: mask,
        start: 'top bottom',
        once: true,
        onEnter: () => playVideo(video),
      },
    })

    tl.to(mask, {
      scale: 1,
      rotation: 0,
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 1.4,
      ease: 'power3.inOut',
      onComplete: () => playVideo(video),
    })
    .call(revealReady, null, 0.7)

    return tl
  })

  if (!videoMasks.length) {
    requestAnimationFrame(revealReady)
  }

  let scrubTimeline = null
  let pinTrigger = null

  if (trigger) {
    pinTrigger = ScrollTrigger.create({
      trigger,
      start: 'top top',
      end: 'bottom top',
      pin: true,
      pinSpacing: false,
      invalidateOnRefresh: true,
    })

    scrubTimeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: 'top 50%',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    })

    if (videoParents.length) {
      scrubTimeline.fromTo(videoParents,
        { scale: 1 },
        {
          scale: 1.5,
          ease: 'none',
        },
        0
      )
    }

    if (moveItems.length) {
      scrubTimeline.fromTo(moveItems,
        { y: '0%' },
        {
          y: '-30%',
          ease: 'none',
        },
        0
      )
    }
  }

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    isAlive = false
    removeScrollListener()
    revealTimelines.forEach((timeline) => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
    })
    scrubTimeline?.scrollTrigger?.kill()
    scrubTimeline?.kill()
    pinTrigger?.kill()
    gsap.set(videoMasks, { clearProps: 'clipPath,transform,transformOrigin,willChange' })
    gsap.set([...videoParents, ...moveItems], { clearProps: 'transform' })
  }
}
