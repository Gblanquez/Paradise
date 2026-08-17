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
import { animateNavbarView, initNavbar, prepareNavbarView } from '../components/navbar.js'
import { prepareAnimationStates } from '../components/prepareAnimationStates.js'
import { initReel } from '../components/reel.js'
import { initScaling } from '../components/scaling.js'
import { scrollToHash, scrollToTop, startRAF } from '../components/scroll.js'
import { initShowcaseSection } from '../components/showcaseSection.js'
import { initTalent } from '../components/talent.js'
import { initWorkCarrousel } from '../components/workCarrousel.js'
import { initTeamCarrousel } from '../components/teamCarrousel.js'
import { initWhySection } from '../components/whySection.js'
import { initVerticalVideos } from '../components/verticalVideos.js'
import titleTextReveal from '../components/titleText.js'

function initProjectVideos(root = document) {
  const videos = Array.from(root.querySelectorAll?.('.project-video') || [])

  if (!videos.length) return () => {}

  const hasVideoSource = (video) => {
    const directSource = video.getAttribute('src')?.trim()
    const childSource = Array.from(video.querySelectorAll('source'))
      .some((source) => source.getAttribute('src')?.trim())

    return Boolean(directSource || childSource)
  }

  const removeListeners = videos.map((video) => {
    const hadControls = video.hasAttribute('controls')
    const playVideo = () => {
      video.play?.().catch(() => {})
    }

    if (!hasVideoSource(video)) {
      video.controls = false
      video.removeAttribute('controls')

      return () => {
        if (hadControls) {
          video.controls = true
          video.setAttribute('controls', '')
        }
      }
    }

    video.controls = true
    video.setAttribute('controls', '')
    video.autoplay = true
    video.playsInline = true
    video.setAttribute('autoplay', '')
    video.setAttribute('playsinline', '')

    if (video.hasAttribute('muted')) {
      video.muted = true
      video.defaultMuted = true
    }

    if (video.readyState >= 2) {
      playVideo()
    } else {
      video.addEventListener('canplay', playVideo, { once: true })
      video.load?.()
    }

    return () => {
      video.removeEventListener('canplay', playVideo)
    }
  })

  return () => {
    removeListeners.forEach((remove) => remove())
  }
}

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
  destroyNavbarView = () => {}
  destroyReel = () => {}
  destroyCta = () => {}
  destroyLines = () => {}
  destroyInfoCarrousel = () => {}
  destroyInfoVideo = () => {}
  destroyVerticalVideos = () => {}
  destroyProjectVideos = () => {}
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
    this.destroyLoadAnimation = initLoadAnimation(this.content, {
      videoSelector: '.reel-video, .info-video, .vertical-video',
    })
    this.destroyFooter = initFooter(this.content)
    this.destroyInfoCarrousel = initInfoCarrousel(this.content)

    const infoVideo = initInfoVideo(this.content)
    this.destroyInfoVideo = () => infoVideo.destroy()

    const verticalVideos = initVerticalVideos(this.content)
    this.destroyVerticalVideos = () => verticalVideos.destroy()
    this.destroyProjectVideos = initProjectVideos(this.content)
    prepareAnimationStates(this.content)
    prepareNavbarView(document)

    afterInitialLoad(() => {
      if (this.isLeaving) return

      this.destroyTitleText = titleTextReveal(this.content)
      this.destroyBodyText = bodyTextReveal(this.content)
      this.destroyImagesAnimation = imagesAnimation(this.content)
      this.destroyNavbarView = animateNavbarView(document)
      this.destroyAboutSection = initAboutSection(this.content)
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
    this.destroyNavbarView()
    this.destroyNavbarView = () => {}
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
    this.destroyProjectVideos()
    this.destroyProjectVideos = () => {}
    this.destroyLoadAnimation()
    this.destroyLoadAnimation = () => {}
  }
}
