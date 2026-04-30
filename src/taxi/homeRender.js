import { Renderer } from '@unseenco/taxi'
import { initWorkCarrousel } from '../components/workCarrousel.js'

export default class homeRender extends Renderer {
  destroyWorkCarrousel = () => {}

  onEnter() {
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
      const transitionName = trigger instanceof HTMLElement
        ? trigger.dataset.transition
        : false
      const isWorkTransition = transitionName === 'workTransition' || transitionName === 'work'

      this.destroyWorkCarrousel({ preserveStyles: isWorkTransition })
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
