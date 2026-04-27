import { Transition } from '@unseenco/taxi'
import { enterWorkVideo, startWorkVideoLeave } from './workVideoTransition.js'

export default class workTransition extends Transition {
  onLeave({ from, done }) {
    startWorkVideoLeave(from)
    done()
  }

  onEnter({ to, done }) {
    enterWorkVideo({ to, wrapper: this.wrapper, done })
  }
}
