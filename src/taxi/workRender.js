import { Renderer } from '@unseenco/taxi'
import { initAlwaysSlider } from '../components/alwaysSlider.js'
import { initAboutSection } from '../components/aboutSection.js'
import bodyTextReveal from '../components/bodyText.js'
import { initCta } from '../components/cta.js'
import { initFooter } from '../components/footer.js'
import { initGlobalLink } from '../components/globalLink.js'
import imagesAnimation from '../components/imagesAnimation.js'
import { initLinkHover } from '../components/linkHover.js'
import { initInfoCarrousel } from '../components/infoCarrousel.js'
import { initInfoVideo } from '../components/infoVideo.js'
import { initLines } from '../components/lines.js'
import { afterInitialLoad, initLoadAnimation } from '../components/load.js'
import { initMask } from '../components/mask.js'
import { initNavbar } from '../components/navbar.js'
import { initReel } from '../components/reel.js'
import { initScaling } from '../components/scaling.js'
import { lenis, startRAF } from '../components/scroll.js'
import { initShowcaseSection } from '../components/showcaseSection.js'
import { initTalent } from '../components/talent.js'
import { initWorkCarrousel } from '../components/workCarrousel.js'
import { initTeamCarrousel } from '../components/teamCarrousel.js'
import { initWhySection } from '../components/whySection.js'
import { initVerticalVideos } from '../components/verticalVideos.js'
import titleTextReveal from '../components/titleText.js'

export default class workRender extends Renderer {
  destroyAlwaysSlider = () => {}
  destroyAboutSection = () => {}
  destroyShowcaseSection = () => {}
  destroyTalent = () => {}
  destroyWhySection = () => {}
  destroyWorkCarrousel = () => {}
  destroyFooter = () => {}
  destroyGlobalLink = () => {}
  destroyTitleText = () => {}
  destroyBodyText = () => {}
  destroyImagesAnimation = () => {}
  destroyLinkHover = () => {}
  destroyNavbar = () => {}
  destroyReel = () => {}
  destroyCta = () => {}
  destroyLines = () => {}
  destroyInfoCarrousel = () => {}
  destroyInfoVideo = () => {}
  destroyVerticalVideos = () => {}
  destroyLoadAnimation = () => {}
  destroyMask = () => {}
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
    this.destroyInfoCarrousel = initInfoCarrousel(this.content)

    const infoVideo = initInfoVideo(this.content)
    this.destroyInfoVideo = () => infoVideo.destroy()

    const verticalVideos = initVerticalVideos(this.content)
    this.destroyVerticalVideos = () => verticalVideos.destroy()
    this.destroyLoadAnimation = initLoadAnimation(this.content)

    afterInitialLoad(() => {
      if (this.isLeaving) return

      this.destroyTitleText = titleTextReveal(this.content)
      this.destroyBodyText = bodyTextReveal(this.content)
      this.destroyImagesAnimation = imagesAnimation(this.content)
      this.destroyAboutSection = initAboutSection(this.content)
      this.destroyFooter = initFooter(this.content)
      this.destroyLines = initLines(this.content)
      this.destroyMask = initMask(this.content)
    })
  }

  onEnterCompleted() {
    window.dispatchEvent(new CustomEvent('page:entered'))

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
    
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed

    this.isLeaving = true

    this.destroyGlobalLink()
    this.destroyGlobalLink = () => {}
    this.destroyTitleText()
    this.destroyTitleText = () => {}
    this.destroyBodyText()
    this.destroyBodyText = () => {}
    this.destroyImagesAnimation()
    this.destroyImagesAnimation = () => {}
    this.destroyLinkHover()
    this.destroyLinkHover = () => {}
    this.destroyAboutSection()
    this.destroyAboutSection = () => {}
    this.destroyFooter()
    this.destroyFooter = () => {}
    this.destroyNavbar()
    this.destroyNavbar = () => {}
    this.destroyReel()
    this.destroyReel = () => {}
    this.destroyCta()
    this.destroyCta = () => {}
    this.destroyLines()
    this.destroyLines = () => {}
    this.destroyMask()
    this.destroyMask = () => {}
    this.destroyInfoCarrousel()
    this.destroyInfoCarrousel = () => {}
    this.destroyInfoVideo()
    this.destroyInfoVideo = () => {}
    this.destroyVerticalVideos()
    this.destroyVerticalVideos = () => {}
    this.destroyLoadAnimation()
    this.destroyLoadAnimation = () => {}
  }
}
