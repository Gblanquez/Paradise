import { Renderer } from '@unseenco/taxi'
import { initProjectList } from '../components/project.js'
import { initWorkCarrousel } from '../components/workCarrousel.js'

export default class globalRender extends Renderer {
  destroyProjectList = () => {}
  destroyWorkCarrousel = () => {}

  onEnter() {
    this.destroyProjectList = initProjectList(this.content)
    this.destroyWorkCarrousel = initWorkCarrousel()
  }

  onEnterCompleted() {
     // run after the transition.onEnter has fully completed
  }

  onLeave() {
    this.destroyProjectList()
    this.destroyProjectList = () => {}
    this.destroyWorkCarrousel({ preserveStyles: true })
    this.destroyWorkCarrousel = () => {}
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
  }
}
