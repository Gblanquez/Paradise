import { Core } from '@unseenco/taxi'
import globalTransition from './globalTransition.js'
import globalRender from './globalRender.js'


const taxi = new Core({
  renderers: {
    default: globalRender,
  },
  transitions: {
    default: globalTransition,


  },
  removeOldContent: true,
})

export default taxi