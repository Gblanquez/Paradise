import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { addScrollListener, lenis, scrollToHash } from './scroll.js'
import { canUseHover } from './hoverSupport.js'

gsap.registerPlugin(SplitText, ScrollTrigger, MorphSVGPlugin)

const SELECTORS = {
  openToggle: '.menu-open-toggle',
  closeToggle: '.menu-close-toggle',
  closeBox: '.menu-close-box',
  closeArrow: '.close-arrow-emb',
  closePath: '.close-svg path',
  contentParent: '.navbar-content-parent',
  boxOne: '.nav-box-one',
  boxTwo: '.nav-box-two',
  link: '.nav-c-link',
  text: '[data-a="nav-text"]',
  label: '[data-a="nav-label"]',
  image: '[data-a="nav-img"]',
  navOp: '[data-a="nav-op"]',
  hero: '#hero',
  logoParent: '.logo-parent',
  linksHolder: '.nav-links-holder',
  linkChild: '[data-a="link-child"]',
  viewBox: '[data-a="nav-box"]',
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

const CLOSE_CIRCLE_PATH = 'M15.2 7.5C15.2 11.4765 11.9765 14.7 8 14.7C4.02355 14.7 0.8 11.4765 0.8 7.5C0.8 3.52355 4.02355 0.3 8 0.3C11.9765 0.3 15.2 3.52355 15.2 7.5Z'

function getNavBoxRotation(box) {
  return box.classList.contains('nav-box-one') ? -45 : 45
}

function getNavBoxOrigin(box) {
  return box.classList.contains('nav-box-one') ? 'right bottom' : 'left bottom'
}

export function prepareNavbarView(root = document) {
  const boxes = gsap.utils.toArray(SELECTORS.viewBox, root)

  if (!boxes.length) return

  gsap.set(boxes, {
    autoAlpha: 0,
    yPercent: -110,
    willChange: 'opacity, transform',
  })
}

export function animateNavbarView(root = document) {
  const boxes = gsap.utils.toArray(SELECTORS.viewBox, root)

  if (!boxes.length) return () => {}

  gsap.killTweensOf(boxes)

  const tween = gsap.to(boxes, {
    autoAlpha: 1,
    yPercent: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.08,
    overwrite: true,
    onComplete: () => {
      gsap.set(boxes, { clearProps: 'willChange' })
    },
  })

  return () => {
    tween.kill()
  }
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

export function initNavbar(root = document) {
  const supportsHover = canUseHover()
  const openToggle = root.querySelector(SELECTORS.openToggle) || document.querySelector(SELECTORS.openToggle)
  const closeToggle = root.querySelector(SELECTORS.closeToggle) || document.querySelector(SELECTORS.closeToggle)
  const contentParent = root.querySelector(SELECTORS.contentParent) || document.querySelector(SELECTORS.contentParent)
  const closeBox = closeToggle?.querySelector(SELECTORS.closeBox) || contentParent?.querySelector(SELECTORS.closeBox)
  const closeArrow = closeToggle?.querySelector(SELECTORS.closeArrow) || contentParent?.querySelector(SELECTORS.closeArrow)
  const closePath = closeToggle?.querySelector(SELECTORS.closePath) || contentParent?.querySelector(SELECTORS.closePath)
  const closePathDefault = closePath?.getAttribute('d')
  const navBoxes = gsap.utils.toArray(`${SELECTORS.boxOne}, ${SELECTORS.boxTwo}`, contentParent || document)
  const navBoxesOut = [
    contentParent?.querySelector(SELECTORS.boxOne),
    contentParent?.querySelector(SELECTORS.boxTwo),
  ].filter(Boolean)
  const navLinks = gsap.utils.toArray(SELECTORS.link, contentParent || document)
  const navLabels = gsap.utils.toArray(SELECTORS.label, contentParent || document)
  const navImages = gsap.utils.toArray(SELECTORS.image, contentParent || document)
  const navOp = gsap.utils.toArray(SELECTORS.navOp, contentParent || document)
  const hero = root.querySelector(SELECTORS.hero) || document.querySelector(SELECTORS.hero)
  const logoParent = root.querySelector(SELECTORS.logoParent) || document.querySelector(SELECTORS.logoParent)
  const linksHolder = root.querySelector(SELECTORS.linksHolder) || document.querySelector(SELECTORS.linksHolder)
  const linkChildren = gsap.utils.toArray(SELECTORS.linkChild, linksHolder || document)
  const layoutItems = [logoParent, openToggle].filter(Boolean)

  if (!openToggle || !closeToggle || !contentParent) return () => {}

  let isOpen = false
  let activeTween = null
  let navTextTweens = []
  let navTextSplits = []
  let navTextGroups = []
  let navLabelTweens = []
  let navLabelSplits = []
  let navLabelLines = []
  let previousBodyOverflow = ''
  let previousHtmlOverflow = ''
  let scrollTween = null
  let scrollTrigger = null
  let closeBoxTween = null
  let removeScrollListener = () => {}
  let navLinksCollapsed = false

  gsap.set(navBoxes, {
    y: '0%',
    yPercent: 110,
    rotation: (index, box) => getNavBoxRotation(box),
    transformOrigin: (index, box) => getNavBoxOrigin(box),
  })
  gsap.set(navLinks, { opacity: 0 })
  gsap.set(navOp, {
    opacity: 0,
    scale: 0,
    rotation: 45,
    transformOrigin: 'top right',
  })
  gsap.set(closeToggle, { opacity: 0 })
  if (closePath) {
    gsap.set(closePath, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      transformOrigin: 'center center',
    })
  }
  if (closeArrow) {
    gsap.set(closeArrow, {
      scale: 1,
      rotation: 0,
      transformOrigin: 'center center',
      willChange: 'transform',
    })
  }
  if (closeBox) {
    gsap.set(closeBox, {
      scale: 0,
      x: '20%',
      y: '-50%',
      rotation: 45,
      transformOrigin: 'top right',
      willChange: 'transform',
    })
  }
  gsap.set(navImages, {
    clipPath: 'inset(100% 0% 0% 0%)',
    overflow: 'hidden',
  })

  if (hero && linksHolder && linkChildren.length) {
    gsap.set(linksHolder, {
      clipPath: 'inset(0% 0% 0% 0%)',
      overflow: 'hidden',
    })

    gsap.set(linkChildren, {
      yPercent: 0,
      opacity: 1,
    })

    const getLayoutRects = () => layoutItems.map((item) => item.getBoundingClientRect())

    const setNavCollapsed = (isCollapsed) => {
      if (isCollapsed === navLinksCollapsed) return

      navLinksCollapsed = isCollapsed
      scrollTween?.kill()

      if (isCollapsed) {
        const beforeRects = getLayoutRects()

        gsap.set(linksHolder, { display: 'none' })
        const afterRects = getLayoutRects()

        gsap.set(linksHolder, {
          display: 'flex',
          clipPath: 'inset(0% 0% 0% 0%)',
          overflow: 'hidden',
          willChange: 'clip-path',
        })

        scrollTween = gsap.timeline({
          defaults: {
            duration: 0.65,
            ease: 'power3.inOut',
            overwrite: true,
          },
          onComplete: () => {
            gsap.set(linksHolder, { display: 'none', clearProps: 'overflow,willChange' })
            gsap.set(layoutItems, { clearProps: 'transform' })
          },
        })
          .to(linksHolder, {
            clipPath: 'inset(0% 50% 0% 50%)',
          }, 0)
          .to(linkChildren, {
            yPercent: -110,
            opacity: 0,
            stagger: 0.025,
          }, 0)
          .to(layoutItems, {
            x: (index) => afterRects[index].left - beforeRects[index].left,
            y: (index) => afterRects[index].top - beforeRects[index].top,
          }, 0)

        return
      }

      const beforeRects = getLayoutRects()

      gsap.set(linksHolder, {
        display: 'flex',
        clipPath: 'inset(0% 50% 0% 50%)',
        overflow: 'hidden',
        willChange: 'clip-path',
      })

      const afterRects = getLayoutRects()

      gsap.set(layoutItems, {
        x: (index) => beforeRects[index].left - afterRects[index].left,
        y: (index) => beforeRects[index].top - afterRects[index].top,
      })

      gsap.set(linkChildren, {
        yPercent: -110,
        opacity: 0,
      })

      scrollTween = gsap.timeline({
        defaults: {
          duration: 0.65,
          ease: 'power3.inOut',
          overwrite: true,
        },
      })
        .to(linksHolder, {
          clipPath: 'inset(0% 0% 0% 0%)',
          onComplete: () => {
            gsap.set(linksHolder, { clearProps: 'overflow,willChange' })
          },
        }, 0)
        .to(layoutItems, {
          x: 0,
          y: 0,
        }, 0)
        .to(linkChildren, {
          yPercent: 0,
          opacity: 1,
          stagger: 0.025,
        }, 0.1)
    }

    scrollTrigger = ScrollTrigger.create({
      id: 'navbar-links',
      trigger: hero,
      start: '30% top',
      onEnter: () => setNavCollapsed(true),
      onLeaveBack: () => setNavCollapsed(false),
    })

    removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  }

  const cleanupNavText = () => {
    navTextTweens.forEach((tween) => tween.kill())
    navTextTweens = []

    navTextSplits.forEach((split) => split.revert())
    navTextSplits = []
    navTextGroups = []
  }

  const cleanupNavLabels = () => {
    navLabelTweens.forEach((tween) => tween.kill())
    navLabelTweens = []

    navLabelSplits.forEach((split) => split.revert())
    navLabelSplits = []
    navLabelLines = []
  }

  const buildNavLabels = () => {
    cleanupNavLabels()

    navLabels.forEach((label) => {
      const split = SplitText.create(label, {
        type: 'lines',
        mask: 'lines',
      })

      gsap.set(split.lines, {
        yPercent: 110,
        opacity: 0,
        willChange: 'transform, opacity',
      })

      navLabelSplits.push(split)
      navLabelLines.push(...split.lines)
    })
  }

  const buildNavText = () => {
    cleanupNavText()

    navLinks.forEach((link) => {
      const text = link.querySelector(SELECTORS.text)

      if (!text) return

      const split = SplitText.create(text, {
        type: 'lines,chars',
        mask: 'lines',
      })
      const gradientLayers = split.chars.map(createGradientLayer).filter(Boolean)

      gsap.set(split.chars, {
        yPercent: 110,
        position: 'relative',
        display: 'inline-block',
        willChange: 'transform',
      })
      gsap.set(gradientLayers, { autoAlpha: 1 })

      navTextSplits.push(split)
      navTextGroups.push({ link, split, gradientLayers })
    })
  }

  const animateNavTextIn = () => {
    navTextGroups.forEach(({ split, gradientLayers }, index) => {
      const delay = 0.15 + index * 0.045

      navTextTweens.push(gsap.to(split.chars, {
        yPercent: 0,
        duration: 0.85,
        delay,
        ease: 'power3.out',
        stagger: 0.014,
        overwrite: true,
        onComplete: () => {
          gsap.set(split.chars, { clearProps: 'willChange' })
        },
      }))

      navTextTweens.push(gsap.to(gradientLayers, {
        autoAlpha: 0,
        duration: 0.45,
        delay: delay + 0.22,
        ease: 'power2.out',
        stagger: 0.014,
        overwrite: true,
      }))
    })
  }

  const lockScroll = () => {
    previousBodyOverflow = document.body.style.overflow
    previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    lenis.stop()
  }

  const unlockScroll = () => {
    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow
    lenis.start()
  }

  const unlockScrollStyles = () => {
    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow
  }

  const getLinkUrl = (link) => {
    const href = link.getAttribute('href')

    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return null

    return new URL(href, window.location.href)
  }

  const isSamePageUrl = (url) => (
    url.origin === window.location.origin
    && url.pathname.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, '')
    && url.search === window.location.search
  )

  const navigateWithTaxi = async (url) => {
    if (url.hash) {
      window.sessionStorage.setItem('pendingHashScroll', url.hash)
    }

    const taxiModule = await import('../taxi/transition.js')
    const taxi = taxiModule.default

    taxi.navigateTo(`${url.pathname}${url.search}${url.hash}`)
  }

  const openMenu = () => {
    if (isOpen) return

    isOpen = true
    contentParent.style.display = 'block'
    lockScroll()
    buildNavText()
    buildNavLabels()
    gsap.set(navOp, {
      opacity: 0,
      scale: 0,
      rotation: 45,
      transformOrigin: 'top right',
    })
    gsap.set(navBoxes, {
      y: '0%',
      yPercent: 110,
      rotation: (index, box) => getNavBoxRotation(box),
      transformOrigin: (index, box) => getNavBoxOrigin(box),
    })

    activeTween?.kill()
    activeTween = gsap.timeline()
      .to(navBoxes, {
        yPercent: 0,
        rotation: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        overwrite: true,
      }, 0)
      .to(navLinks, {
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.035,
        overwrite: true,
        onStart: animateNavTextIn,
      }, 0.18)
      .to(closeToggle, {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: true,
      }, 0.18)
      .to(navOp, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.65,
        ease: 'power3.out',
        stagger: 0.05,
        overwrite: true,
        onComplete: () => {
          gsap.set(navOp, { clearProps: 'willChange' })
        },
      }, 1.05)
      .to(navLabelLines, {
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.045,
        overwrite: true,
        onComplete: () => {
          gsap.set(navLabelLines, { clearProps: 'willChange' })
        },
      }, 0.42)
      .to(navImages, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.9,
        ease: 'power3.inOut',
        stagger: 0.08,
        overwrite: true,
      }, 0.38)
  }

  const closeMenu = ({ restartScroll = true } = {}) => {
    if (!isOpen) return Promise.resolve()

    isOpen = false
    activeTween?.kill()
    closeBoxTween?.kill()
    navTextTweens.forEach((tween) => tween.kill())
    navTextTweens = []

    const navTextChars = navTextGroups.flatMap(({ split }) => split.chars)

    return new Promise((resolve) => {
      activeTween = gsap.timeline({
        onComplete: () => {
          gsap.set(navBoxes, {
            y: '0%',
            yPercent: 110,
            rotation: (index, box) => getNavBoxRotation(box),
            transformOrigin: (index, box) => getNavBoxOrigin(box),
          })
          gsap.set(navLinks, { opacity: 0 })
          gsap.set(navOp, {
            opacity: 0,
            scale: 0,
            rotation: 45,
            transformOrigin: 'top right',
          })
          gsap.set(closeToggle, { opacity: 0 })
          if (closeBox) {
            gsap.set(closeBox, {
              scale: 0,
              x: '20%',
              y: '-50%',
              rotation: 45,
              transformOrigin: 'top right',
            })
          }
          if (closePath && closePathDefault) {
            gsap.set(closePath, { attr: { d: closePathDefault }, opacity: 1, scale: 1, rotation: 0 })
          }
          if (closeArrow) {
            gsap.set(closeArrow, { scale: 1, rotation: 0 })
          }
          gsap.set(navImages, { clipPath: 'inset(100% 0% 0% 0%)' })

          cleanupNavText()
          cleanupNavLabels()
          contentParent.style.display = 'none'

          if (restartScroll) {
            unlockScroll()
          } else {
            unlockScrollStyles()
          }

          resolve()
        },
      })
        .to(closeToggle, {
          opacity: 0,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: true,
        }, 0)
        .to(closeBox || [], {
          scale: 0,
          x: '20%',
          y: '-50%',
          rotation: 45,
          duration: 0.3,
          ease: 'power3.in',
          overwrite: true,
        }, 0)
        .to(closePath || [], {
          opacity: 1,
          scale: 1,
          rotation: 0,
          morphSVG: {
            shape: closePathDefault,
            shapeIndex: 'auto',
          },
          duration: 0.3,
          ease: 'power3.in',
          overwrite: true,
        }, 0)
        .to(closeArrow || [], {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: 'power3.in',
          overwrite: true,
        }, 0)
        .to(navOp, {
          opacity: 0,
          scale: 0,
          rotation: 45,
          duration: 0.3,
          ease: 'power3.in',
          stagger: 0.025,
          overwrite: true,
        }, 0)
        .to(navLinks, {
          opacity: 0,
          duration: 0.25,
          ease: 'power2.out',
          stagger: 0.02,
          overwrite: true,
        }, 0)
        .to(navTextChars, {
          yPercent: -110,
          duration: 0.32,
          ease: 'power3.in',
          stagger: 0.006,
          overwrite: true,
        }, 0)
        .to(navLabelLines, {
          yPercent: 110,
          opacity: 0,
          duration: 0.32,
          ease: 'power3.in',
          stagger: 0.018,
          overwrite: true,
        }, 0)
        .to(navImages, {
          clipPath: 'inset(100% 0% 0% 0%)',
          duration: 0.35,
          ease: 'power3.inOut',
          stagger: 0.035,
          overwrite: true,
        }, 0)
        .to(navBoxesOut, {
          y: '110%',
          rotation: (index, box) => getNavBoxRotation(box),
          duration: 0.58,
          ease: 'power3.inOut',
          stagger: 0.07,
          overwrite: true,
        }, 0.36)
    })
  }

  const removeHoverListeners = navLinks.map((link) => {
    const getGradientLayers = () => navTextGroups.find((group) => group.link === link)?.gradientLayers || []
    const onClick = async (event) => {
      const url = getLinkUrl(link)

      if (!url || url.origin !== window.location.origin) return

      if (url.hash && isSamePageUrl(url)) {
        event.preventDefault()
        if (isOpen) {
          await closeMenu()
        }
        window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`)
        scrollToHash(url.hash)
        return
      }

      if (!isOpen) return

      event.preventDefault()
      navigateWithTaxi(url).catch(() => {
        closeMenu()
        window.location.href = url.href
      })
    }
    const onEnter = () => {
      const layers = getGradientLayers()

      if (!layers.length) return

      gsap.killTweensOf(layers)
      gsap.fromTo(layers, {
        autoAlpha: 0,
      }, {
        autoAlpha: 1,
        duration: 0.28,
        ease: 'power2.out',
        stagger: {
          each: 0.018,
          from: 'start',
        },
        overwrite: true,
      })
    }
    const onLeave = () => {
      const layers = getGradientLayers()

      if (!layers.length) return

      gsap.killTweensOf(layers)
      gsap.to(layers, {
        autoAlpha: 0,
        duration: 0.28,
        ease: 'power2.out',
        stagger: {
          each: 0.018,
          from: 'start',
        },
        overwrite: true,
      })
    }

    if (supportsHover) {
      link.addEventListener('pointerenter', onEnter)
      link.addEventListener('pointerleave', onLeave)
      link.addEventListener('focus', onEnter)
      link.addEventListener('blur', onLeave)
    }
    link.addEventListener('click', onClick)

    return () => {
      if (supportsHover) {
        link.removeEventListener('pointerenter', onEnter)
        link.removeEventListener('pointerleave', onLeave)
        link.removeEventListener('focus', onEnter)
        link.removeEventListener('blur', onLeave)
      }
      link.removeEventListener('click', onClick)
    }
  })

  openToggle.addEventListener('click', openMenu)
  closeToggle.addEventListener('click', closeMenu)

  const showCloseBox = () => {
    closeBoxTween?.kill()
    closeBoxTween = gsap.timeline({
      defaults: {
        duration: 0.5,
        ease: 'power3.inOut',
        overwrite: true,
      },
    })
      .to(closeBox || [], {
        scale: 1.3,
        x: '0%',
        y: '0%',
        rotation: 0,
      }, 0)
      .to(closePath || [], {
        opacity: 1,
        scale: 1,
        rotation: 0,
        morphSVG: {
          shape: CLOSE_CIRCLE_PATH,
          shapeIndex: 'auto',
        },
      }, 0)
      .to(closeArrow || [], {
        scale: 0.5,
      }, 0)
  }

  const hideCloseBox = () => {
    closeBoxTween?.kill()
    closeBoxTween = gsap.timeline({
      defaults: {
        duration: 0.45,
        ease: 'power3.inOut',
        overwrite: true,
      },
    })
      .to(closeBox || [], {
        scale: 0,
        x: '20%',
        y: '-50%',
        rotation: 45,
      }, 0)
      .to(closePath || [], {
        opacity: 1,
        scale: 1,
        rotation: 0,
        morphSVG: {
          shape: closePathDefault,
          shapeIndex: 'auto',
        },
      }, 0)
      .to(closeArrow || [], {
        scale: 1,
        rotation: 0,
      }, 0)
  }

  if (supportsHover) {
    closeToggle.addEventListener('pointerenter', showCloseBox)
    closeToggle.addEventListener('pointerleave', hideCloseBox)
    closeToggle.addEventListener('focus', showCloseBox)
    closeToggle.addEventListener('blur', hideCloseBox)
  }

  const closeMenuDuringTransition = () => {
    closeMenu({ restartScroll: false })
  }

  window.addEventListener('global-transition-cover-start', closeMenuDuringTransition)

  return () => {
    activeTween?.kill()
    closeBoxTween?.kill()
    scrollTween?.kill()
    scrollTrigger?.kill()
    removeScrollListener()
    cleanupNavText()
    cleanupNavLabels()
    removeHoverListeners.forEach((removeListener) => removeListener())
    openToggle.removeEventListener('click', openMenu)
    closeToggle.removeEventListener('click', closeMenu)
    if (supportsHover) {
      closeToggle.removeEventListener('pointerenter', showCloseBox)
      closeToggle.removeEventListener('pointerleave', hideCloseBox)
      closeToggle.removeEventListener('focus', showCloseBox)
      closeToggle.removeEventListener('blur', hideCloseBox)
    }
    window.removeEventListener('global-transition-cover-start', closeMenuDuringTransition)

    if (isOpen) {
      closeMenu()
    }

    gsap.set(navBoxes, { clearProps: 'transform,transformOrigin' })
    gsap.set(navLinks, { clearProps: 'opacity' })
    gsap.set(navOp, { clearProps: 'opacity,transform,transformOrigin,willChange' })
    gsap.set(closeToggle, { clearProps: 'opacity' })
    if (closeBox) {
      gsap.set(closeBox, { clearProps: 'transform,transformOrigin,willChange' })
    }
    if (closeArrow) {
      gsap.set(closeArrow, { clearProps: 'transform,transformOrigin,willChange' })
    }
    if (closePath && closePathDefault) {
      gsap.set(closePath, { attr: { d: closePathDefault }, clearProps: 'opacity,transform,transformOrigin' })
    }
    gsap.set(navImages, { clearProps: 'clipPath,overflow' })
    gsap.set(linksHolder, { clearProps: 'display,overflow,clipPath' })
    gsap.set(linkChildren, { clearProps: 'transform,opacity' })
    gsap.set(layoutItems, { clearProps: 'transform' })
  }
}
