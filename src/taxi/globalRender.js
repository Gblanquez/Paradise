import { Renderer } from '@unseenco/taxi'
import { initAboutSection } from '../components/aboutSection.js'

export default class globalRender extends Renderer {
  destroyAboutSection = () => {}

  onEnter() {
    this.destroyAboutSection = initAboutSection(this.content)
  }

  onEnterCompleted() {
    // run after the transition.onEnter has fully completed
  }

  onLeave() {
    this.destroyAboutSection()
    this.destroyAboutSection = () => {}
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
  }
}
