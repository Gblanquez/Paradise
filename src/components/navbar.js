import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener, lenis } from './scroll.js'

gsap.registerPlugin(SplitText, ScrollTrigger)

const SELECTORS = {
  openToggle: '.menu-open-toggle',
  closeToggle: '.menu-close-toggle',
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
  const openToggle = root.querySelector(SELECTORS.openToggle) || document.querySelector(SELECTORS.openToggle)
  const closeToggle = root.querySelector(SELECTORS.closeToggle) || document.querySelector(SELECTORS.closeToggle)
  const contentParent = root.querySelector(SELECTORS.contentParent) || document.querySelector(SELECTORS.contentParent)
  const navBoxes = gsap.utils.toArray(`${SELECTORS.boxOne}, ${SELECTORS.boxTwo}`, contentParent || document)
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
  let removeScrollListener = () => {}
  let navLinksCollapsed = false

  gsap.set(navBoxes, {
    yPercent: 110,
    rotation: 45,
    transformOrigin: 'left bottom',
  })
  gsap.set(navLinks, { opacity: 0 })
  gsap.set(navOp, {
    opacity: 0,
    clipPath: 'inset(100% 0% 0% 0%)',
    overflow: 'hidden',
  })
  gsap.set(closeToggle, { opacity: 0 })
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
        })

        scrollTween = gsap.timeline({
          defaults: {
            duration: 0.65,
            ease: 'power3.inOut',
            overwrite: true,
          },
          onComplete: () => {
            gsap.set(linksHolder, { display: 'none' })
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
            gsap.set(linksHolder, { clearProps: 'overflow' })
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
        }, 0)
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

  const scrollToHash = (hash) => {
    if (!hash) return

    const target = document.querySelector(hash)

    if (!target) return

    lenis.scrollTo(target, {
      offset: 0,
      force: true,
    })
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
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.05,
        overwrite: true,
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
    navTextTweens.forEach((tween) => tween.kill())
    navTextTweens = []
    gsap.set(navBoxes, { yPercent: 110, rotation: 45 })
    gsap.set(navLinks, { opacity: 0 })
    gsap.set(navOp, { opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' })
    gsap.set(closeToggle, { opacity: 0 })
    gsap.set(navImages, { clipPath: 'inset(100% 0% 0% 0%)' })
    cleanupNavText()
    cleanupNavLabels()
    contentParent.style.display = 'none'

    if (restartScroll) {
      unlockScroll()
    } else {
      unlockScrollStyles()
    }

    return Promise.resolve()
  }

  const removeHoverListeners = navLinks.map((link) => {
    const getGradientLayers = () => navTextGroups.find((group) => group.link === link)?.gradientLayers || []
    const onClick = async (event) => {
      if (!isOpen) return

      const url = getLinkUrl(link)

      if (!url || url.origin !== window.location.origin) return

      event.preventDefault()

      if (url.hash && isSamePageUrl(url)) {
        await closeMenu()
        window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`)
        scrollToHash(url.hash)
        return
      }

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

    link.addEventListener('pointerenter', onEnter)
    link.addEventListener('pointerleave', onLeave)
    link.addEventListener('focus', onEnter)
    link.addEventListener('blur', onLeave)
    link.addEventListener('click', onClick)

    return () => {
      link.removeEventListener('pointerenter', onEnter)
      link.removeEventListener('pointerleave', onLeave)
      link.removeEventListener('focus', onEnter)
      link.removeEventListener('blur', onLeave)
      link.removeEventListener('click', onClick)
    }
  })

  openToggle.addEventListener('click', openMenu)
  closeToggle.addEventListener('click', closeMenu)

  const closeMenuDuringTransition = () => {
    closeMenu({ restartScroll: false })
  }

  window.addEventListener('global-transition-cover-start', closeMenuDuringTransition)

  return () => {
    activeTween?.kill()
    scrollTween?.kill()
    scrollTrigger?.kill()
    removeScrollListener()
    cleanupNavText()
    cleanupNavLabels()
    removeHoverListeners.forEach((removeListener) => removeListener())
    openToggle.removeEventListener('click', openMenu)
    closeToggle.removeEventListener('click', closeMenu)
    window.removeEventListener('global-transition-cover-start', closeMenuDuringTransition)

    if (isOpen) {
      closeMenu()
    }

    gsap.set(navBoxes, { clearProps: 'transform,transformOrigin' })
    gsap.set(navLinks, { clearProps: 'opacity' })
    gsap.set(navOp, { clearProps: 'opacity,clipPath,overflow' })
    gsap.set(closeToggle, { clearProps: 'opacity' })
    gsap.set(navImages, { clearProps: 'clipPath,overflow' })
    gsap.set(linksHolder, { clearProps: 'display,overflow,clipPath' })
    gsap.set(linkChildren, { clearProps: 'transform,opacity' })
    gsap.set(layoutItems, { clearProps: 'transform' })
  }
}
