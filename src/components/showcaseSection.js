import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'
import { canUseHover } from './hoverSupport.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  spacer: '.spacer-wrapper',
  imageFrame: '.spacer-img-container',
  imageContainer: '.space-image-container',
  image: '[data-a="space-img"]',
}

export function initShowcaseSection(root = document) {
  const spacer = root.querySelector(SELECTORS.spacer) || document.querySelector(SELECTORS.spacer)
  const imageFrame = spacer?.querySelector(SELECTORS.imageFrame)
    || root.querySelector(SELECTORS.imageFrame)
    || document.querySelector(SELECTORS.imageFrame)
  const imageContainer = spacer?.querySelector(SELECTORS.imageContainer)
    || root.querySelector(SELECTORS.imageContainer)
    || document.querySelector(SELECTORS.imageContainer)
  const images = imageContainer ? gsap.utils.toArray(SELECTORS.image, imageContainer) : []
  const supportsHover = canUseHover()

  if (!spacer || !imageFrame) return () => {}

  gsap.set(imageFrame, {
    clipPath: 'polygon(15% 0%, 85% 0%, 85% 100%, 15% 100%)',
    transformOrigin: 'center center',
    willChange: 'clip-path, transform',
  })

  const movementTl = gsap.timeline({
    scrollTrigger: {
      trigger: spacer,
      start: 'top bottom',
      end: 'bottom 20%',
      scrub: true,
      invalidateOnRefresh: true,
    },
  })

  movementTl.to(imageFrame, {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    scale: 1.2,
    ease: 'none',
  }, 0)

  let imageIndex = 0
  let zIndex = 1
  let lastX = 0
  let lastY = 0
  let lastTime = 0
  let isPointerInside = false
  let imageWidth = 0
  let imageHeight = 0
  const minStampDistance = 110
  const minStampDelay = 120

  const measureTrail = () => {
    if (!imageContainer || !images.length) return

    const containerRect = imageContainer.getBoundingClientRect()
    const imageRect = images[0].getBoundingClientRect()

    imageWidth = imageRect.width || containerRect.width
    imageHeight = imageRect.height || containerRect.height
  }

  const showTrailImage = (event) => {
    if (!images.length || !imageWidth || !imageHeight) return

    const now = performance.now()
    const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY)

    if (now - lastTime < minStampDelay && distance < minStampDistance) return

    lastX = event.clientX
    lastY = event.clientY
    lastTime = now

    const containerRect = imageContainer.getBoundingClientRect()
    const image = images[imageIndex]
    const x = event.clientX - containerRect.left - imageWidth / 2
    const y = event.clientY - containerRect.top - imageHeight / 2

    imageIndex = (imageIndex + 1) % images.length
    zIndex += 1

    gsap.killTweensOf(image)
    gsap.set(image, {
      x,
      y,
      zIndex,
      willChange: 'transform, opacity',
    })

    gsap.timeline({
      onComplete: () => {
        gsap.set(image, { clearProps: 'willChange' })
      },
    })
      .fromTo(image, {
        opacity: 0,
        scale: 0.1,
        rotate: gsap.utils.random(-3, 3),
      }, {
        opacity: 1,
        scale: 1,
        rotate: gsap.utils.random(-1, 1),
        duration: 0.78,
        ease: 'expo.out',
      }, 0)
      .to(image, {
        opacity: 0,
        scale: 0.1,
        duration: 1.45,
        ease: 'power2.inOut',
      }, 1)
  }

  const handlePointerEnter = (event) => {
    isPointerInside = true
    measureTrail()
    showTrailImage(event)
  }

  const handlePointerMove = (event) => {
    if (!isPointerInside) return

    showTrailImage(event)
  }

  const handlePointerLeave = () => {
    isPointerInside = false
    gsap.to(images, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  if (supportsHover && imageContainer && images.length) {
    gsap.set(imageContainer, {
      pointerEvents: 'none',
      overflow: 'visible',
    })

    gsap.set(images, {
      position: 'absolute',
      left: 0,
      top: 0,
      opacity: 0,
      pointerEvents: 'none',
      transformOrigin: 'center center',
    })

    measureTrail()
    spacer.addEventListener('pointerenter', handlePointerEnter)
    spacer.addEventListener('pointermove', handlePointerMove)
    spacer.addEventListener('pointerleave', handlePointerLeave)
  }

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    removeScrollListener()
    movementTl.scrollTrigger?.kill()
    movementTl.kill()
    spacer.removeEventListener('pointerenter', handlePointerEnter)
    spacer.removeEventListener('pointermove', handlePointerMove)
    spacer.removeEventListener('pointerleave', handlePointerLeave)
    gsap.set(imageFrame, { clearProps: 'clipPath,transform,transformOrigin,willChange' })
    gsap.set(imageContainer, { clearProps: 'pointerEvents,overflow' })
    gsap.set(images, { clearProps: 'position,left,top,opacity,transform,transformOrigin,zIndex,pointerEvents,willChange' })
  }
}
