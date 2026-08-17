import { Renderer } from '@unseenco/taxi'
import { initAlwaysSlider } from '../components/alwaysSlider.js'
import { initAboutSection } from '../components/aboutSection.js'
import bodyTextReveal from '../components/bodyText.js'
import { initCta } from '../components/cta.js'
import { initExpertiseAnimation } from '../components/expertiseAnimation.js'
import { initExpertiseLinkAnimation } from '../components/expertiseLinkAnimation.js'
import { initFooter } from '../components/footer.js'
import { initGlobalLink } from '../components/globalLink.js'
import { initHeroSection } from '../components/heroSection.js'
import imagesAnimation from '../components/imagesAnimation.js'
import { initLinkHover } from '../components/linkHover.js'
import { initLines } from '../components/lines.js'
import { afterInitialLoad, initLoadAnimation } from '../components/load.js'
import { initMask } from '../components/mask.js'
import { animateNavbarView, initNavbar, prepareNavbarView } from '../components/navbar.js'
import { initReel } from '../components/reel.js'
import { prepareAnimationStates } from '../components/prepareAnimationStates.js'
import { initScaling } from '../components/scaling.js'
import { scrollToHash, scrollToTop, startRAF } from '../components/scroll.js'
import { initShowcaseSection } from '../components/showcaseSection.js'
import { initTalent } from '../components/talent.js'
import { initTeamHoverAnimation } from '../components/teamHoverAnimation.js'
import { initWorkCarrousel } from '../components/workCarrousel.js'
import { initTeamCarrousel } from '../components/teamCarrousel.js'
import { initWhySection } from '../components/whySection.js'
import titleTextReveal from '../components/titleText.js'

export default class globalRender extends Renderer {
  destroyAlwaysSlider = () => {}
  destroyAboutSection = () => {}
  destroyShowcaseSection = () => {}
  destroyTalent = () => {}
  destroyTeamHoverAnimation = () => {}
  destroyWhySection = () => {}
  destroyWorkCarrousel = () => {}
  destroyFooter = () => {}
  destroyGlobalLink = () => {}
  destroyTitleText = () => {}
  destroyBodyText = () => {}
  destroyImagesAnimation = () => {}
  destroyHeroSection = () => {}
  destroyLinkHover = () => {}
  destroyNavbar = () => {}
  destroyNavbarView = () => {}
  destroyReel = () => {}
  destroyCta = () => {}
  destroyExpertiseAnimation = () => {}
  destroyExpertiseLinkAnimation = () => {}
  destroyLines = () => {}
  destroyMask = () => {}
  destroyLoadAnimation = () => {}
  isLeaving = false

  onEnter() {
    // basic Taxi renderer
    this.isLeaving = false
    initScaling()
    startRAF()
    this.destroyGlobalLink = initGlobalLink(this.content)
    this.destroyNavbar = initNavbar(document)
    this.destroyReel = initReel(document).destroy
    this.destroyCta = initCta(this.content)
    this.destroyLinkHover = initLinkHover(this.content)
    this.destroyExpertiseLinkAnimation = initExpertiseLinkAnimation(document)
    this.destroyLoadAnimation = initLoadAnimation(this.content)
    this.destroyFooter = initFooter(this.content)
    prepareAnimationStates(this.content)
    prepareNavbarView(document)

    afterInitialLoad(() => {
      if (this.isLeaving) return

      let hasInitializedTextReveals = false
      const initTextReveals = () => {
        if (this.isLeaving) return
        if (hasInitializedTextReveals) return

        hasInitializedTextReveals = true
        this.destroyNavbarView = animateNavbarView(document)
        this.destroyTitleText = titleTextReveal(this.content)
        this.destroyBodyText = bodyTextReveal(this.content)
      }

      this.destroyImagesAnimation = imagesAnimation(this.content)
      this.destroyHeroSection = initHeroSection(this.content, {
        onRevealReady: initTextReveals,
      })
    //   initTeamCarrousel()
      this.destroyAlwaysSlider = initAlwaysSlider(this.content)
      this.destroyAboutSection = initAboutSection(this.content)
      this.destroyShowcaseSection = initShowcaseSection(this.content)
      this.destroyTalent = initTalent(this.content)
      this.destroyTeamHoverAnimation = initTeamHoverAnimation(this.content)
      this.destroyWhySection = initWhySection(this.content)
      this.destroyExpertiseAnimation = initExpertiseAnimation(this.content)
    //   this.destroyWorkCarrousel = initWorkCarrousel(this.content)
      this.destroyLines = initLines(this.content)
      this.destroyMask = initMask(this.content)
    })
  }

  onEnterCompleted() {
    window.dispatchEvent(new CustomEvent('page:entered'))

    const pendingScrollTop = window.sessionStorage.getItem('pendingScrollTop')
    const pendingHash = window.sessionStorage.getItem('pendingHashScroll') || window.location.hash

    if (!pendingScrollTop && !pendingHash) return

    window.sessionStorage.removeItem('pendingScrollTop')
    window.sessionStorage.removeItem('pendingHashScroll')

    requestAnimationFrame(() => {
      if (pendingScrollTop) {
        scrollToTop()
        return
      }
      scrollToHash(pendingHash)
    })
  }

  onLeave() {
    // basic Taxi renderer

  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
    this.isLeaving = true
    this.destroyAlwaysSlider()
    this.destroyAlwaysSlider = () => {}
    this.destroyAboutSection()
    this.destroyAboutSection = () => {}
    this.destroyShowcaseSection()
    this.destroyShowcaseSection = () => {}
    this.destroyTalent()
    this.destroyTalent = () => {}
    this.destroyTeamHoverAnimation()
    this.destroyTeamHoverAnimation = () => {}
    this.destroyWhySection()
    this.destroyWhySection = () => {}
    // this.destroyWorkCarrousel({ preserveStyles: true })
    // this.destroyWorkCarrousel = () => {}
    this.destroyFooter()
    this.destroyFooter = () => {}
    this.destroyGlobalLink()
    this.destroyGlobalLink = () => {}
    this.destroyTitleText()
    this.destroyTitleText = () => {}
    this.destroyBodyText()
    this.destroyBodyText = () => {}
    this.destroyImagesAnimation()
    this.destroyImagesAnimation = () => {}
    this.destroyHeroSection()
    this.destroyHeroSection = () => {}
    this.destroyLinkHover()
    this.destroyLinkHover = () => {}
    this.destroyNavbar()
    this.destroyNavbar = () => {}
    this.destroyNavbarView()
    this.destroyNavbarView = () => {}
    this.destroyReel()
    this.destroyReel = () => {}
    this.destroyCta()
    this.destroyCta = () => {}
    this.destroyExpertiseAnimation()
    this.destroyExpertiseAnimation = () => {}
    this.destroyExpertiseLinkAnimation()
    this.destroyExpertiseLinkAnimation = () => {}
    this.destroyLines()
    this.destroyLines = () => {}
    this.destroyMask()
    this.destroyMask = () => {}
    this.destroyLoadAnimation()
    this.destroyLoadAnimation = () => {}
  }
}
