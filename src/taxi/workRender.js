import { Renderer } from '@unseenco/taxi'
import { initWorkVideoControls } from '../components/workVideoControls.js'

export default class workRender extends Renderer {
  destroyWorkVideoControls = () => {}

  onEnter() {
    this.destroyWorkVideoControls = initWorkVideoControls(this.content)
  }

  onEnterCompleted() {
    // run after the transition.onEnter has fully completed
  }

  onLeave() {
    this.destroyWorkVideoControls()
    this.destroyWorkVideoControls = () => {}
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
  }
}
