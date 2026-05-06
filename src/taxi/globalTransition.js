import { Transition } from '@unseenco/taxi'
import gsap from 'gsap'
import { removeOldContent } from './removeOldContent.js'

const REVEAL = {
  duration: 1,
  ease: 'power3.inOut',
}

const SELECTORS = {
  transitionOverlay: '.white-overlay',
}

export default class globalTransition extends Transition {
  /**
   * Handle the transition leaving the previous page.
   * @param { { from: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
   */
  onLeave({ from, trigger, done }) {
    gsap.set(from, {
      pointerEvents: 'none',
    })

    done()
  }

  /**
   * Handle the transition entering the next page.
   * @param { { to: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
   */
  onEnter({ to, trigger, done }) {
    gsap.set(to, {
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100dvh',
      overflow: 'hidden',
      zIndex: 102,
      clipPath: 'inset(100% 0 0 0)',
      willChange: 'clip-path',
    })

    gsap.to(to, {
      clipPath: 'inset(0% 0 0 0)',
      duration: REVEAL.duration,
      ease: REVEAL.ease,
      onComplete: () => {
        gsap.set(gsap.utils.toArray(SELECTORS.transitionOverlay, to), {
          opacity: 0,
          pointerEvents: 'none',
        })
        removeOldContent(this.wrapper, to)
        gsap.set(to, {
          clearProps: 'position,inset,width,height,overflow,zIndex,clipPath,willChange',
        })
        done()
      },
    })
  }
}
