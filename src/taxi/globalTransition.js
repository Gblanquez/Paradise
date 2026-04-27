import { Transition } from '@unseenco/taxi'
import { enterWorkVideo, startWorkVideoLeave } from './workVideoTransition.js'

export default class globalTransition extends Transition {
  /**
   * Handle the transition leaving the previous page.
   * @param { { from: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
   */
  onLeave({ from, trigger, done }) {
    startWorkVideoLeave(from)
    done()
  }

  /**
   * Handle the transition entering the next page.
   * @param { { to: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
   */
  onEnter({ to, trigger, done }) {
    enterWorkVideo({ to, wrapper: this.wrapper, done })
  }
}
