import { Core } from '@unseenco/taxi'
import globalTransition from './globalTransition.js'
import globalRender from './globalRender.js'
import homeRender from './homeRender.js'
import projectRender from './projectRender.js'
import workTransition from './workTransition.js'
import workRender from './workRender.js'


const taxi = new Core({
  renderers: {
    default: globalRender,
    home: homeRender,
    projects: projectRender,
    work: workRender
  },
  transitions: {
    default: globalTransition,
    work: workTransition,
    workTransition: workTransition
  },
  removeOldContent: true,
})

export default taxi
