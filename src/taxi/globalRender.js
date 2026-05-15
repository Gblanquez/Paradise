import { Renderer } from '@unseenco/taxi'
import { initAlwaysSlider } from '../components/alwaysSlider.js'
import { initCta } from '../components/cta.js'
import { initGlobalLink } from '../components/globalLink.js'
import { initLines } from '../components/lines.js'
import { initNavbar } from '../components/navbar.js'
import { initReel } from '../components/reel.js'
import { initScaling } from '../components/scaling.js'
import { lenis, startRAF } from '../components/scroll.js'
import { initShowcaseSection } from '../components/showcaseSection.js'
import { initTalent } from '../components/talent.js'
import { initWorkCarrousel } from '../components/workCarrousel.js'
import { initTeamCarrousel } from '../components/teamCarrousel.js'
import { initWhySection } from '../components/whySection.js'
import titleTextReveal from '../components/titleText.js'

export default class globalRender extends Renderer {
  destroyAlwaysSlider = () => {}
  destroyShowcaseSection = () => {}
  destroyTalent = () => {}
  destroyWhySection = () => {}
  destroyWorkCarrousel = () => {}
  destroyGlobalLink = () => {}
  destroyTitleText = () => {}
  destroyNavbar = () => {}
  destroyReel = () => {}
  destroyCta = () => {}
  destroyLines = () => {}

  onEnter() {
    // basic Taxi renderer
    this.destroyTitleText = titleTextReveal(this.content)
    initScaling()
    startRAF()
    initTeamCarrousel()
    this.destroyAlwaysSlider = initAlwaysSlider(this.content)
    this.destroyShowcaseSection = initShowcaseSection(this.content)
    this.destroyTalent = initTalent(this.content)
    this.destroyWhySection = initWhySection(this.content)
    this.destroyWorkCarrousel = initWorkCarrousel(this.content)
    this.destroyGlobalLink = initGlobalLink(this.content)
    this.destroyNavbar = initNavbar(document)
    this.destroyReel = initReel(document).destroy
    this.destroyCta = initCta(this.content)
    this.destroyLines = initLines(this.content)
  }

  onEnterCompleted() {
    const pendingHash = window.sessionStorage.getItem('pendingHashScroll') || window.location.hash

    if (!pendingHash) return

    window.sessionStorage.removeItem('pendingHashScroll')

    requestAnimationFrame(() => {
      const target = document.querySelector(pendingHash)

      if (!target) return

      lenis.scrollTo(target, {
        offset: 0,
        force: true,
      })
    })
  }

  onLeave() {
    // basic Taxi renderer
    this.destroyAlwaysSlider()
    this.destroyAlwaysSlider = () => {}
    this.destroyShowcaseSection()
    this.destroyShowcaseSection = () => {}
    this.destroyTalent()
    this.destroyTalent = () => {}
    this.destroyWhySection()
    this.destroyWhySection = () => {}
    this.destroyWorkCarrousel()
    this.destroyWorkCarrousel = () => {}
    this.destroyGlobalLink()
    this.destroyGlobalLink = () => {}
    this.destroyTitleText()
    this.destroyTitleText = () => {}
    this.destroyNavbar()
    this.destroyNavbar = () => {}
    this.destroyReel()
    this.destroyReel = () => {}
    this.destroyCta()
    this.destroyCta = () => {}
    this.destroyLines()
    this.destroyLines = () => {}
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
  }
}
