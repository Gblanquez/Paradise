import { Renderer } from '@unseenco/taxi'
import { initAboutSection } from '../components/aboutSection.js'
import { initWorkCarrousel } from '../components/workCarrousel.js'

export default class homeRender extends Renderer {
  destroyAboutSection = () => {}
  destroyWorkCarrousel = () => {}

  onEnter() {
    this.destroyAboutSection = initAboutSection(this.content)
    this.destroyWorkCarrousel = initWorkCarrousel()
  }

  onEnterCompleted() {
    // run after the transition.onEnter has fully completed
  }

  onLeave() {
    // handled in leave() so we can inspect the active Taxi transition
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
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
      this.destroyWorkCarrousel({ preserveStyles: true })
      this.destroyWorkCarrousel = () => {}

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
}
