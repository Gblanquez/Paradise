import { Core } from '@unseenco/taxi'
import globalTransition from './globalTransition.js'
import globalRender from './globalRender.js'
import workRender from './workRender.js'
import projectRender from './projectRender.js'


const taxi = new Core({
  renderers: {
    default: globalRender,
    home: globalRender,
    work: workRender,
    projects: projectRender,
  },
  transitions: {
    default: globalTransition,
    workTransition: globalTransition,
  },
  removeOldContent: true,
})

export default taxi
