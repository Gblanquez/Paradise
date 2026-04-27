import { Core } from '@unseenco/taxi'
import globalTransition from './globalTransition.js'
import globalRender from './globalRender.js'
import workTransition from './workTransition.js'
import workRender from './workRender.js'


const taxi = new Core({
  renderers: {
    default: globalRender,
    work: workRender
  },
  transitions: {
    default: globalTransition,
    work: workTransition


  },
  removeOldContent: true,
})

export default taxi