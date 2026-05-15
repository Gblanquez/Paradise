import { Core } from '@unseenco/taxi'
import globalTransition from './globalTransition.js'
import globalRender from './globalRender.js'


const taxi = new Core({
  renderers: {
    default: globalRender,
    home: globalRender,
    work: globalRender,
    projects: globalRender,
  },
  transitions: {
    default: globalTransition,
    workTransition: globalTransition,
  },
  removeOldContent: true,
})

export default taxi
