import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(ScrollTrigger, SplitText)

const SELECTORS = {
  parent: '[data-a="always-slider-parent"]',
  thumbnail: '[data-a="always-thumbnail"]',
  thumbText: '[data-a="always-thumb-text"]',
  title: '[data-a="always-title"]',
  body: '[data-a="always-body"]',
  image: '[data-a="always-img"]',
  label: '[data-a="always-label"]',
  line: '[data-a="always-line"]',
}

const SLIDE_DURATION = 10

function getItems(parent, selector) {
  return gsap.utils.toArray(selector, parent)
}

function getContentItems(parent, selector) {
  return getItems(parent, selector).filter((item) => !item.closest(SELECTORS.thumbnail))
}

function getSlideCount(groups) {
  return Math.min(...groups.filter((group) => group.length).map((group) => group.length))
}

function setActive(items, activeIndex) {
  items.forEach((item, index) => {
    if (index === activeIndex) {
      gsap.set(item, {
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
        zIndex: items.length + index,
      })
      return
    }

    gsap.set(item, {
      opacity: 0,
      visibility: 'hidden',
      pointerEvents: 'none',
      zIndex: index,
    })
  })
}

function setActiveThumbnail(thumbnails, activeIndex) {
  thumbnails.forEach((thumbnail, index) => {
    const thumbText = thumbnail.querySelector(SELECTORS.thumbText)
    const isActive = index === activeIndex

    gsap.set(thumbnail, {
      opacity: isActive ? 1 : 0.5,
      visibility: 'visible',
      pointerEvents: 'auto',
      zIndex: isActive ? thumbnails.length + index : index,
    })

    if (thumbText) {
      gsap.set(thumbText, {
        opacity: isActive ? 1 : 0,
      })
    }
  })
}

function splitTextItems(items) {
  return items.map((item) => ({
    item,
    split: SplitText.create(item, {
      type: 'lines',
      mask: 'lines',
    }),
  }))
}

export function initAlwaysSlider(root = document) {
  const parents = gsap.utils.toArray(SELECTORS.parent, root)

  if (!parents.length) return () => {}

  const sliders = parents.map((parent) => {
    const thumbnails = getItems(parent, SELECTORS.thumbnail)
    const thumbTexts = thumbnails.map((thumbnail) => thumbnail.querySelector(SELECTORS.thumbText)).filter(Boolean)
    const titles = getContentItems(parent, SELECTORS.title)
    const bodies = getContentItems(parent, SELECTORS.body)
    const images = getContentItems(parent, SELECTORS.image)
    const labels = getContentItems(parent, SELECTORS.label)
    const lines = getItems(parent, SELECTORS.line)
    const slideCount = getSlideCount([titles, bodies, images, labels, lines])

    if (!slideCount || slideCount < 2 || !lines.length) {
      return { destroy: () => {} }
    }

    const titleSplits = splitTextItems(titles)
    const bodySplits = splitTextItems(bodies)
    const labelSplits = splitTextItems(labels)
    const textSplits = [...titleSplits, ...bodySplits, ...labelSplits]

    let activeIndex = 0
    let isActive = false
    let timerTween = null
    let slideTween = null
    const thumbnailClickHandlers = []
    const thumbnailHoverHandlers = []

    const animateText = (index) => {
      const activeSplits = textSplits
        .filter(({ item }) => item === titles[index] || item === bodies[index] || item === labels[index])
        .flatMap(({ split }) => split.lines)

      if (!activeSplits.length) return

      gsap.fromTo(activeSplits,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.06,
          overwrite: true,
        }
      )
    }

    const resetInactiveLines = (previousIndex, immediate = false) => {
      const outgoingLine = lines[previousIndex]

      lines.forEach((line, index) => {
        if (index === activeIndex) return

        if (index !== previousIndex || immediate) {
          gsap.set(line, {
            width: '0%',
            scaleX: 1,
            x: '0%',
            transformOrigin: 'left center',
          })
        }
      })

      if (!outgoingLine || outgoingLine === lines[activeIndex] || immediate) {
        return gsap.timeline()
      }

      gsap.timeline({ overwrite: true })
        .to(outgoingLine, {
          width: '100%',
          scaleX: 1,
          x: '40vw',
          transformOrigin: 'left center',
          duration: 1.4,
          ease: 'power3.inOut',
        })
        .set(outgoingLine, {
          width: '0%',
          scaleX: 1,
          x: '0%',
          transformOrigin: 'left center',
        })

      return gsap.timeline()
    }

    const startTimer = (previousIndex, immediate = false) => {
      timerTween?.kill()
      resetInactiveLines(previousIndex, immediate)

      const activeLine = lines[activeIndex]

      if (!activeLine) return

      if (!isActive) return

      gsap.set(activeLine, {
        width: '0%',
        scaleX: 1,
        x: '0%',
        transformOrigin: 'left center',
      })

      timerTween = gsap.to(activeLine, {
        width: '100%',
        duration: SLIDE_DURATION,
        ease: 'none',
        onComplete: () => {
          showSlide((activeIndex + 1) % slideCount)
        },
      })
    }

    const showSlide = (nextIndex, immediate = false) => {
      const previousIndex = activeIndex

      activeIndex = nextIndex
      slideTween?.kill()

      setActiveThumbnail(thumbnails, activeIndex)
      setActive(titles, activeIndex)
      setActive(bodies, activeIndex)
      setActive(images, activeIndex)
      setActive(labels, activeIndex)

      if (!immediate) {
        animateText(activeIndex)
      }

      startTimer(previousIndex, immediate)
    }

    thumbnails.forEach((thumbnail, index) => {
      const handler = () => {
        showSlide(index % slideCount)
      }
      const showThumbText = () => {
        const thumbText = thumbnail.querySelector(SELECTORS.thumbText)

        if (!thumbText || index === activeIndex) return

        gsap.to(thumbText, {
          opacity: 0.5,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: true,
        })
      }
      const hideThumbText = () => {
        const thumbText = thumbnail.querySelector(SELECTORS.thumbText)

        if (!thumbText || index === activeIndex) return

        gsap.to(thumbText, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: true,
        })
      }

      thumbnail.addEventListener('click', handler)
      thumbnail.addEventListener('pointerenter', showThumbText)
      thumbnail.addEventListener('pointerleave', hideThumbText)
      thumbnail.addEventListener('focusin', showThumbText)
      thumbnail.addEventListener('focusout', hideThumbText)
      thumbnailClickHandlers.push({ thumbnail, handler })
      thumbnailHoverHandlers.push({ thumbnail, showThumbText, hideThumbText })
    })

    const play = () => {
      if (isActive) return

      isActive = true
      showSlide(activeIndex, true)
    }

    const pause = () => {
      isActive = false
      timerTween?.pause()
    }

    gsap.set(lines, {
      width: '0%',
      scaleX: 1,
      x: '0%',
      transformOrigin: 'left center',
    })

    showSlide(0, true)
    pause()

    const trigger = ScrollTrigger.create({
      trigger: parent,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: play,
      onEnterBack: play,
      onLeave: pause,
      onLeaveBack: pause,
    })

    return {
      destroy: () => {
        isActive = false
        timerTween?.kill()
        slideTween?.kill()
        trigger.kill()
        thumbnailClickHandlers.forEach(({ thumbnail, handler }) => {
          thumbnail.removeEventListener('click', handler)
        })
        thumbnailHoverHandlers.forEach(({ thumbnail, showThumbText, hideThumbText }) => {
          thumbnail.removeEventListener('pointerenter', showThumbText)
          thumbnail.removeEventListener('pointerleave', hideThumbText)
          thumbnail.removeEventListener('focusin', showThumbText)
          thumbnail.removeEventListener('focusout', hideThumbText)
        })
        gsap.set(lines, { clearProps: 'width,transform,transformOrigin' })
        gsap.set([thumbnails, titles, bodies, images, labels].flat(), { clearProps: 'opacity,visibility,pointerEvents,zIndex' })
        gsap.set(thumbTexts, { clearProps: 'opacity' })
        textSplits.forEach(({ split }) => split.revert())
      },
    }
  })

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    removeScrollListener()
    sliders.forEach((slider) => slider.destroy())
  }
}
