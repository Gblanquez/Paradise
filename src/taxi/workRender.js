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
    // handled in leave() so open info panels can stay visually stable during work transitions
  }

  leave(transition, trigger, removeOldContent) {
    return new Promise((resolve) => {
      const transitionTrigger = trigger instanceof HTMLElement
        ? trigger.closest('[data-transition]')
        : null
      const transitionName = transitionTrigger?.dataset.transition || false
      const isWorkTransition = transitionName === 'workTransition' || transitionName === 'work'

      this.destroyAboutSection()
      this.destroyAboutSection = () => {}
      this.destroyInfoProjects({ preserveStyles: isWorkTransition })
      this.destroyInfoProjects = () => {}
      this.destroyWorkVideoControls()
      this.destroyWorkVideoControls = () => {}

      transition.leave({ trigger, from: this.content })
        .then(() => {
          if (removeOldContent && !isWorkTransition) {
            this.remove()
          }

          this.onLeaveCompleted()
          resolve()
        })
    })
  }

  destroy() {
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
