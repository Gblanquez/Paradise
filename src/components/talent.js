import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener, lenis } from './scroll.js'
import { canUseHover } from './hoverSupport.js'

gsap.registerPlugin(SplitText, ScrollTrigger)

const SELECTORS = {
  boxWrapper: '.talent-box-wrapper',
  wrapper: '[data-a="talent-wrapper"]',
  trigger: '[data-a="talent-trigger"]',
  content: '[data-a="talent-content"]',
  closeTrigger: '.close-trigger',
  body: '[data-a="talent-body"]',
  bodyText: '[data-a="body-text"]',
  bgBlur: '.bg-blur',
  imageWrap: '[data-a="talent-img-wrap"]',
  label: '[data-a="talent-label"]',
  line: '.line',
  projectImage: '[data-a="talent-imagery"]',
  talentBoxOne: '.talent-box-one',
  talentBoxTwo: '.talent-box-two',
  talentContainer: '.talent-container',
  talentItem: '.cl-tl-item',
  talentHoverBox: '.talent-hover-box',
  titleText: '[data-a="title-text"]',
}

const GRADIENT = `linear-gradient(
  90deg,
  #c9f5ff 0%,
  #7bb6ff 13%,
  #121421 29%,
  #020000 34%,
  #170000 39%,
  #d94520 57%,
  #df5ca6 68%,
  #d98cff 75%,
  #111018 85%,
  #f28db3 91%,
  #2e8ef7 100%
)`

function uniqueElements(elements) {
  return [...new Set(elements.filter((element) => element && element.nodeType === 1))]
}

function createGradientLayer(char) {
  if (!char.textContent.trim()) return null

  const layer = document.createElement('span')

  layer.textContent = char.textContent
  layer.setAttribute('aria-hidden', 'true')
  layer.style.position = 'absolute'
  layer.style.inset = '0'
  layer.style.pointerEvents = 'none'
  layer.style.background = GRADIENT
  layer.style.backgroundSize = '180% 100%'
  layer.style.backgroundPosition = 'center'
  layer.style.webkitBackgroundClip = 'text'
  layer.style.backgroundClip = 'text'
  layer.style.webkitTextFillColor = 'transparent'
  layer.style.color = 'transparent'

  char.appendChild(layer)

  return layer
}

function splitBodyLines(elements) {
  return elements.map((element) => ({
    element,
    split: SplitText.create(element, {
      type: 'lines',
      mask: 'lines',
    }),
  }))
}

function splitTitleChars(elements) {
  return elements.map((element) => ({
    element,
    split: SplitText.create(element, {
      type: 'lines,chars',
      mask: 'lines',
    }),
  }))
}

export function initTalent(root = document) {
  const wrappers = gsap.utils.toArray(SELECTORS.wrapper, root)
  const allTriggers = gsap.utils.toArray(SELECTORS.trigger, root)
  const allContents = gsap.utils.toArray(SELECTORS.content, root)
  const boxWrappers = gsap.utils.toArray(SELECTORS.boxWrapper, root)
  const talentHoverItems = gsap.utils.toArray(SELECTORS.talentItem, root)
  const supportsHover = canUseHover()

  if (!wrappers.length && !allTriggers.length && !allContents.length && !boxWrappers.length && !talentHoverItems.length) return () => {}

  let activePanel = null
  let isPageScrollLocked = false
  let previousBodyOverflow = ''
  let previousHtmlOverflow = ''
  const revealTriggers = []
  const removeScrollListener = boxWrappers.length ? addScrollListener(() => ScrollTrigger.update()) : () => {}

  const hoverInstances = supportsHover ? talentHoverItems.map((item) => {
    const boxes = gsap.utils.toArray(SELECTORS.talentHoverBox, item)

    if (!boxes.length) return null

    let hoverTween = null

    gsap.set(boxes, {
      xPercent: -110,
      scaleX: 1,
      transformOrigin: 'left center',
    })

    const enter = () => {
      hoverTween?.kill()
      gsap.set(boxes, { transformOrigin: 'left center' })

      hoverTween = gsap.to(boxes, {
        xPercent: 0,
        scaleX: 1,
        duration: 1.2,
        ease: 'expo.out',
        overwrite: true,
      })
    }

    const leave = () => {
      hoverTween?.kill()
      gsap.set(boxes, { transformOrigin: 'left center' })

      hoverTween = gsap.to(boxes, {
        xPercent: -110,
        scaleX: 1,
        duration: 1.2,
        ease: 'expo.out',
        overwrite: true,
      })
    }

    item.addEventListener('pointerenter', enter)
    item.addEventListener('pointerleave', leave)
    item.addEventListener('focusin', enter)
    item.addEventListener('focusout', leave)

    return {
      destroy: () => {
        hoverTween?.kill()
        item.removeEventListener('pointerenter', enter)
        item.removeEventListener('pointerleave', leave)
        item.removeEventListener('focusin', enter)
        item.removeEventListener('focusout', leave)
        gsap.set(boxes, { clearProps: 'transform,transformOrigin' })
      },
    }
  }).filter(Boolean) : []

  const lockPageScroll = () => {
    if (isPageScrollLocked) return

    previousBodyOverflow = document.body.style.overflow
    previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    lenis.stop()
    isPageScrollLocked = true
  }

  const unlockPageScroll = () => {
    if (!isPageScrollLocked) return

    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow
    lenis.start()
    isPageScrollLocked = false
  }

  if (boxWrappers.length) {
    gsap.set(boxWrappers, {
      opacity: 0,
      rotation: -45,
      transformOrigin: 'top right',
      willChange: 'opacity, transform',
    })

    boxWrappers.forEach((box, index) => {
      const trigger = ScrollTrigger.create({
        trigger: box,
        start: 'top bottom',
        onEnter: () => {
          gsap.to(box, {
            opacity: 1,
            rotation: 0,
            duration: 0.8,
            delay: index * 0.01,
            ease: 'power3.out',
            overwrite: true,
            onComplete: () => {
              gsap.set(box, { clearProps: 'willChange' })
            },
          })
        },
        onLeaveBack: () => {
          gsap.killTweensOf(box)
          gsap.set(box, {
            opacity: 0,
            rotation: -45,
            transformOrigin: 'top right',
            willChange: 'opacity, transform',
          })
        },
      })

      revealTriggers.push(trigger)
    })
  }

  const talentItems = wrappers.length ? wrappers : allTriggers

  const accordions = talentItems.map((wrapper, index) => {
    const trigger = wrapper.matches?.(SELECTORS.trigger)
      ? wrapper
      : wrapper.querySelector(SELECTORS.trigger) || allTriggers[index]
    const content = wrapper.matches?.(SELECTORS.content)
      ? wrapper
      : wrapper.querySelector(SELECTORS.content) || allContents[index]
    const animationRoot = content || wrapper
    const talentContainer = animationRoot.querySelector(SELECTORS.talentContainer) || animationRoot
    const imageWrap = animationRoot.querySelector(SELECTORS.imageWrap)
    const lines = gsap.utils.toArray(SELECTORS.line, animationRoot)
    const projectImages = gsap.utils.toArray(SELECTORS.projectImage, animationRoot)
    const closeTrigger = animationRoot.querySelector(SELECTORS.closeTrigger)
    const bgBlur = animationRoot.querySelector(SELECTORS.bgBlur)
    const movingBoxes = [
      animationRoot.querySelector(SELECTORS.talentBoxTwo),
      animationRoot.querySelector(SELECTORS.talentBoxOne),
    ].filter(Boolean)

    if (!trigger || !content) return { destroy: () => {} }

    const originalParent = content.parentElement
    const originalNextSibling = content.nextElementSibling

    if (content.parentElement !== document.body) {
      document.body.appendChild(content)
    }

    const titleElements = uniqueElements([
      ...gsap.utils.toArray(SELECTORS.label, animationRoot),
      ...gsap.utils.toArray(SELECTORS.titleText, animationRoot),
    ])
    const bodyElements = uniqueElements([
      ...gsap.utils.toArray(SELECTORS.body, animationRoot),
      ...gsap.utils.toArray(SELECTORS.bodyText, animationRoot),
    ])
    let titleSplits = []
    let titleChars = []
    let gradientLayers = []
    let bodySplits = []
    let bodyLines = []
    let isOpen = false
    let activeTween = null
    let panelInstance = null

    const prepareText = () => {
      if (!titleSplits.length && titleElements.length) {
        titleSplits = splitTitleChars(titleElements)
        titleChars = titleSplits.flatMap(({ split }) => split.chars)
        gradientLayers = titleChars.map(createGradientLayer).filter(Boolean)

        gsap.set(titleElements, { autoAlpha: 1 })
        gsap.set(titleChars, {
          yPercent: 110,
          position: 'relative',
          display: 'inline-block',
          willChange: 'transform',
        })
        gsap.set(gradientLayers, { autoAlpha: 1 })
      }

      if (!bodySplits.length && bodyElements.length) {
        bodySplits = splitBodyLines(bodyElements)
        bodyLines = bodySplits.flatMap(({ split }) => split.lines)

        gsap.set(bodyElements, { autoAlpha: 1 })
        gsap.set(bodyLines, {
          yPercent: 100,
          willChange: 'transform',
        })
      }
    }

    const keepPanelScrollLocal = (event) => {
      event.stopPropagation()
    }

    gsap.set(content, {
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100dvh',
      zIndex: 100,
      display: 'flex',
      autoAlpha: 0,
      pointerEvents: 'none',
      overflowX: 'hidden',
      overflowY: 'scroll',
      overscrollBehavior: 'contain',
      touchAction: 'pan-y',
      willChange: 'opacity',
    })

    gsap.set(talentContainer, {
      xPercent: 110,
      willChange: 'transform',
    })

    content.style.webkitOverflowScrolling = 'touch'
    content.addEventListener('wheel', keepPanelScrollLocal, { passive: true })
    content.addEventListener('touchmove', keepPanelScrollLocal, { passive: true })

    if (projectImages.length) {
      gsap.set(projectImages, {
        clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
        overflow: 'hidden',
        transformOrigin: 'center center',
        willChange: 'clip-path',
      })
    }

    if (lines.length) {
      gsap.set(lines, {
        scaleX: 0,
        transformOrigin: 'top right',
        willChange: 'transform',
      })
    }

    if (movingBoxes.length) {
      gsap.set(movingBoxes, {
        xPercent: 110,
        willChange: 'transform',
      })
    }

    if (bgBlur) {
      gsap.set(bgBlur, {
        opacity: 0,
        willChange: 'opacity',
      })
    }

    const open = () => {
      if (isOpen) return

      if (activePanel && activePanel !== panelInstance) {
        activePanel.close()
      }

      activePanel = panelInstance
      isOpen = true
      activeTween?.kill()
      lockPageScroll()
      gsap.set(content, { pointerEvents: 'auto' })
      prepareText()

      activeTween = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => {
          activeTween = null
        },
      })

      activeTween.to(content, {
        autoAlpha: 1,
        duration: 0.35,
        ease: 'power2.out',
      }, 0)

      activeTween.to(talentContainer, {
        xPercent: 0,
        duration: 0.85,
      }, 0)

      if (movingBoxes.length) {
        activeTween.to(movingBoxes, {
          xPercent: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.2,
        }, 0.08)
      }

      if (bgBlur) {
        activeTween.to(bgBlur, {
          opacity: 0.6,
          duration: 0.8,
          ease: 'power2.out',
        }, 0.05)
      }

      if (titleChars.length) {
        activeTween.to(titleChars, {
          yPercent: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: {
            each: 0.018,
            from: 'start',
          },
        }, 0.42)

        activeTween.to(gradientLayers, {
          autoAlpha: 0,
          duration: 0.55,
          ease: 'power2.out',
          stagger: {
            each: 0.018,
            from: 'start',
          },
        }, 0.72)
      }

      if (bodyLines.length) {
        activeTween.to(bodyLines, {
          yPercent: 0,
          duration: 1.05,
          ease: 'power3.out',
          stagger: 0.06,
        }, 0.54)
      }

      if (lines.length) {
        activeTween.to(lines, {
          scaleX: 1,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.08,
        }, 0.62)
      }

      if (projectImages.length) {
        activeTween.to(projectImages, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          duration: 1.2,
          ease: 'power4.out',
          stagger: 0.22,
        }, 0.82)
      }

    }

    const close = () => {
      if (!isOpen) return

      isOpen = false
      activeTween?.kill()

      if (activePanel === panelInstance) {
        activePanel = null
      }

      activeTween = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => {
          gsap.set(content, { pointerEvents: 'none' })
          if (!activePanel) {
            unlockPageScroll()
          }
          activeTween = null
        },
      })

      activeTween.to(talentContainer, {
        xPercent: 110,
        duration: 0.45,
      }, 0)

      activeTween.to(content, {
        autoAlpha: 0,
        duration: 0.35,
        ease: 'power2.in',
      }, 0.08)

      if (movingBoxes.length) {
        activeTween.to(movingBoxes, {
          xPercent: 110,
          duration: 0.35,
          ease: 'power3.in',
          stagger: 0.08,
        }, 0)
      }

      if (bgBlur) {
        activeTween.to(bgBlur, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
        }, 0)
      }

      activeTween.set(titleChars, { yPercent: 110 })
      activeTween.set(gradientLayers, { autoAlpha: 1 })
      activeTween.set(bodyLines, { yPercent: 100 })
      activeTween.set(lines, { scaleX: 0 })
      activeTween.set(projectImages, { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' })
    }

    const toggle = () => {
      if (isOpen) {
        close()
        return
      }

      open()
    }

    trigger.addEventListener('click', toggle)
    closeTrigger?.addEventListener('click', close)

    panelInstance = {
      close,
      destroy: () => {
        activeTween?.kill()
        trigger.removeEventListener('click', toggle)
        closeTrigger?.removeEventListener('click', close)
        content.removeEventListener('wheel', keepPanelScrollLocal)
        content.removeEventListener('touchmove', keepPanelScrollLocal)
        if (activePanel === panelInstance) {
          activePanel = null
          unlockPageScroll()
        }
        titleSplits.forEach(({ split }) => split.revert())
        bodySplits.forEach(({ split }) => split.revert())
        content.style.webkitOverflowScrolling = ''
        gsap.set(content, { clearProps: 'position,inset,width,height,zIndex,display,opacity,visibility,pointerEvents,overflowX,overflowY,overscrollBehavior,touchAction,willChange' })
        gsap.set(talentContainer, { clearProps: 'transform,willChange' })
        if (imageWrap) {
          gsap.set(imageWrap, { clearProps: 'overflow' })
        }
        if (lines.length) {
          gsap.set(lines, { clearProps: 'transform,transformOrigin,willChange' })
        }
        if (projectImages.length) {
          gsap.set(projectImages, { clearProps: 'clipPath,overflow,transformOrigin,willChange' })
        }
        if (movingBoxes.length) {
          gsap.set(movingBoxes, { clearProps: 'transform,willChange' })
        }
        if (bgBlur) {
          gsap.set(bgBlur, { clearProps: 'opacity,willChange' })
        }

        if (originalParent?.isConnected) {
          originalParent.insertBefore(content, originalNextSibling)
        } else if (content.isConnected) {
          content.remove()
        }
      },
    }

    return panelInstance
  })

  return () => {
    revealTriggers.forEach((trigger) => trigger.kill())
    removeScrollListener()
    gsap.set(boxWrappers, { clearProps: 'opacity,transform,transformOrigin,willChange' })
    hoverInstances.forEach((instance) => instance.destroy())
    accordions.forEach((accordion) => accordion.destroy())
  }
}
