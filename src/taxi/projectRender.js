import { Renderer } from '@unseenco/taxi'
import { initProjectList } from '../components/project.js'

export default class projectRender extends Renderer {
  destroyProjectList = () => {}

  onEnter() {
    this.destroyProjectList = initProjectList(this.content)
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

      this.destroyProjectList()
      this.destroyProjectList = () => {}

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
