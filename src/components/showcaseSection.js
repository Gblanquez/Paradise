import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  spacer: '.spacer-showcase',
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
    || imageFrame?.querySelector(SELECTORS.imageContainer)
    || root.querySelector(SELECTORS.imageContainer)
    || document.querySelector(SELECTORS.imageContainer)
  const images = imageContainer ? Array.from(imageContainer.querySelectorAll(SELECTORS.image)) : []

  if (!spacer || !imageFrame) return () => {}

  if (images.length > 1) {
    gsap.set(imageContainer, { position: 'relative' })
    gsap.set(images, {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      display: 'none',
      zIndex: 0,
    })
    gsap.set(images[0], { clearProps: 'display', zIndex: 3 })
  }

  if (imageContainer) {
    gsap.set(imageContainer, {
      y: '-60%',
      willChange: 'transform',
    })
  }

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

  if (imageContainer) {
    movementTl.to(imageContainer, { y: '80%', ease: 'none' }, 0)
  }

  let imageTrigger = null

  if (images.length > 1) {
    const setActiveImage = (activeIndex) => {
      images.forEach((image, index) => {
        gsap.set(image, {
          display: index === activeIndex ? '' : 'none',
          zIndex: index === activeIndex ? images.length + index : index,
        })
      })
    }

    setActiveImage(0)

    imageTrigger = ScrollTrigger.create({
      trigger: spacer,
      start: 'top 30%',
      end: 'bottom 50%',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const activeIndex = Math.min(
          images.length - 1,
          Math.floor(self.progress * images.length)
        )

        setActiveImage(activeIndex)
      },
    })
  }

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    removeScrollListener()
    movementTl.scrollTrigger?.kill()
    movementTl.kill()
    imageTrigger?.kill()
    gsap.set(imageFrame, { clearProps: 'clipPath,transform,transformOrigin,willChange' })
    gsap.set(imageContainer, { clearProps: 'position,transform,willChange' })
    gsap.set(images, { clearProps: 'position,inset,width,height,display,zIndex' })
  }
}
