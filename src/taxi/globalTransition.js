import { Transition } from '@unseenco/taxi'
import gsap from 'gsap'
import { lenis } from '../components/scroll.js'

const SELECTORS = {
  parent: '.page-load-parent',
  boxOne: '.transition-box-one',
  boxTwo: '.transition-box-two',
}

function getTransitionElements() {
  const parent = document.querySelector(SELECTORS.parent)
  const boxes = [
    document.querySelector(SELECTORS.boxTwo),
    document.querySelector(SELECTORS.boxOne),
  ].filter(Boolean)

  return { parent, boxes }
}

function getBoxRotation(box) {
  return box.classList.contains('transition-box-one') ? -45 : 45
}

function getBoxOrigin(box) {
  return box.classList.contains('transition-box-one') ? 'right bottom' : 'left bottom'
}

function unlockPageScroll() {
  document.body.style.removeProperty('overflow')
  document.documentElement.style.removeProperty('overflow')
  lenis.start()
  lenis.resize()
}

export default class globalTransition extends Transition {
  /**
   * Handle the transition leaving the previous page.
   * @param { { from: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
   */
  onLeave({ from, trigger, done }) {
    const { parent, boxes } = getTransitionElements()

    if (!parent || !boxes.length) {
      unlockPageScroll()
      done()
      return
    }

    gsap.killTweensOf([parent, ...boxes])
    gsap.set(parent, {
      display: 'block',
      opacity: 1,
      pointerEvents: 'auto',
      visibility: 'visible',
    })
    gsap.set(boxes, {
      yPercent: 110,
      rotation: (index, box) => getBoxRotation(box),
      transformOrigin: (index, box) => getBoxOrigin(box),
    })

    gsap.to(boxes, {
      yPercent: 0,
      rotation: 0,
      duration: 0.85,
      ease: 'power3.inOut',
      stagger: 0.08,
      overwrite: true,
      onStart: () => {
        window.dispatchEvent(new CustomEvent('global-transition-cover-start'))
      },
      onComplete: () => {
        done()
      },
    })
  }

  /**
   * Handle the transition entering the next page.
   * @param { { to: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
   */
  onEnter({ to, trigger, done }) {
    const { parent, boxes } = getTransitionElements()

    lenis.scrollTo(0, {
      immediate: true,
      force: true,
    })
    window.scrollTo(0, 0)

    if (!parent || !boxes.length) {
      unlockPageScroll()
      done()
      return
    }

    gsap.killTweensOf([parent, ...boxes])
    gsap.set(parent, {
      display: 'block',
      opacity: 1,
      pointerEvents: 'auto',
      visibility: 'visible',
    })
    gsap.set(boxes, {
      yPercent: 0,
      rotation: 0,
      transformOrigin: (index, box) => getBoxOrigin(box),
    })

    gsap.to(parent, {
      opacity: 0,
      duration: 0.55,
      ease: 'power2.out',
      overwrite: true,
      onComplete: () => {
        gsap.set(parent, {
          display: 'none',
          opacity: 0,
          pointerEvents: 'none',
          visibility: 'hidden',
        })
        gsap.set(boxes, {
          yPercent: 110,
          rotation: (index, box) => getBoxRotation(box),
          clearProps: 'transformOrigin',
        })
        unlockPageScroll()
        done()
      },
    })
  }
}
