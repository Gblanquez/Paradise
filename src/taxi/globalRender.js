import { Renderer } from '@unseenco/taxi'
import { initWorkCarrousel } from '../components/workCarrousel.js'

export default class globalRender extends Renderer {
  destroyWorkCarrousel = () => {}

  onEnter() {
    this.destroyWorkCarrousel = initWorkCarrousel()
  }

  onEnterCompleted() {
     // run after the transition.onEnter has fully completed
  }

  onLeave() {
    this.destroyWorkCarrousel({ preserveStyles: true })
    this.destroyWorkCarrousel = () => {}
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
  }
}
