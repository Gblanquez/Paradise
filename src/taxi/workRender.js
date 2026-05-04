import { Renderer } from '@unseenco/taxi'
import { initAboutSection } from '../components/aboutSection.js'
import { initInfoProjects } from '../components/infoProjects.js'
import { initWorkVideoControls } from '../components/workVideoControls.js'

export default class workRender extends Renderer {
  destroyAboutSection = () => {}
  destroyInfoProjects = () => {}
  destroyWorkVideoControls = () => {}

  onEnter() {
    this.destroyAboutSection = initAboutSection(this.content)
    this.destroyInfoProjects = initInfoProjects(this.content)
    this.destroyWorkVideoControls = initWorkVideoControls(this.content)
  }

  onEnterCompleted() {
    // run after the transition.onEnter has fully completed
  }

  onLeave() {
    this.destroyAboutSection()
    this.destroyAboutSection = () => {}
    this.destroyInfoProjects()
    this.destroyInfoProjects = () => {}
    this.destroyWorkVideoControls()
    this.destroyWorkVideoControls = () => {}
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
  }
}
