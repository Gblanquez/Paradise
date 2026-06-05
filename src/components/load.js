import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { lenis } from './scroll.js'

gsap.registerPlugin(SplitText)

const SELECTORS = {
  parent: '.page-load-parent',
  pageMain: '.page-main',
  content: '.load-content-parent',
  text: '[data-a="load-text"]',
  line: '.load-page-line',
  progressLine: '.line-load-page',
  svgWrap: '.load-svg-wrap',
  logoPath: '.logo-svg path',
  images: '.img',
  videos: '.reel-video, .info-video, .main-work-video, .main-workp-video, .vertical-video',
}

const MAX_LOAD_IMAGES = 10
const IMAGE_LOAD_TIMEOUT = 3500

let hasPlayed = false
let loadComplete = false
let loadPromise = Promise.resolve()
let resolveLoadPromise = () => {}

export function afterInitialLoad(callback) {
  if (loadComplete) {
    callback()
    return
  }

  loadPromise.then(callback)
}

function getLoadProgress(video) {
  if (!video.duration || !Number.isFinite(video.duration) || video.buffered.length === 0) {
    return video.readyState >= 2 ? 0.65 : 0
  }

  return video.buffered.end(video.buffered.length - 1) / video.duration
}

function waitForVideo(video, onProgress) {
  return new Promise((resolve) => {
    let timeout = null

    const complete = () => {
      cleanup()
      onProgress(1)
      resolve()
    }

    const update = () => {
      onProgress(Math.max(0.1, getLoadProgress(video) * 0.95))
    }

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', update)
      video.removeEventListener('loadeddata', update)
      video.removeEventListener('progress', update)
      video.removeEventListener('canplay', complete)
      video.removeEventListener('canplaythrough', complete)
      video.removeEventListener('error', complete)

      if (timeout) {
        window.clearTimeout(timeout)
      }
    }

    if (video.readyState >= 3) {
      complete()
      return
    }

    timeout = window.setTimeout(complete, 8000)

    video.preload = 'auto'
    video.addEventListener('loadedmetadata', update)
    video.addEventListener('loadeddata', update)
    video.addEventListener('progress', update)
    video.addEventListener('canplay', complete, { once: true })
    video.addEventListener('canplaythrough', complete, { once: true })
    video.addEventListener('error', complete, { once: true })

    video.load()
    update()
  })
}

function waitForVideos(videos, onProgress) {
  if (!videos.length) {
    onProgress(1)
    return Promise.resolve()
  }

  const progresses = videos.map((video) => (video.readyState >= 3 ? 1 : 0))
  const updateTotal = () => {
    const total = progresses.reduce((sum, progress) => sum + progress, 0) / progresses.length

    onProgress(total)
  }

  updateTotal()

  return Promise.all(videos.map((video, index) => (
    waitForVideo(video, (progress) => {
      progresses[index] = progress
      updateTotal()
    })
  )))
}

function waitForImage(image, onProgress) {
  return new Promise((resolve) => {
    let timeout = null

    const complete = () => {
      cleanup()
      onProgress(1)
      resolve()
    }

    const cleanup = () => {
      image.removeEventListener('load', complete)
      image.removeEventListener('error', complete)

      if (timeout) {
        window.clearTimeout(timeout)
      }
    }

    if (image.complete && image.naturalWidth > 0) {
      complete()
      return
    }

    timeout = window.setTimeout(complete, IMAGE_LOAD_TIMEOUT)

    onProgress(0.1)
    image.addEventListener('load', complete, { once: true })
    image.addEventListener('error', complete, { once: true })
  })
}

function waitForAssets(videos, images, onProgress) {
  const assets = [...videos, ...images]

  if (!assets.length) {
    onProgress(1)
    return Promise.resolve()
  }

  const progresses = assets.map((asset) => {
    if (asset instanceof HTMLVideoElement) return asset.readyState >= 3 ? 1 : 0
    return asset.complete && asset.naturalWidth > 0 ? 1 : 0
  })

  const updateTotal = () => {
    const total = progresses.reduce((sum, progress) => sum + progress, 0) / progresses.length

    onProgress(total)
  }

  updateTotal()

  return Promise.all(assets.map((asset, index) => {
    if (asset instanceof HTMLVideoElement) {
      return waitForVideo(asset, (progress) => {
        progresses[index] = progress
        updateTotal()
      })
    }

    return waitForImage(asset, (progress) => {
      progresses[index] = progress
      updateTotal()
    })
  }))
}

export function initLoadAnimation(root = document) {
  if (hasPlayed) {
    const pageMain = root.querySelector(SELECTORS.pageMain) || document.querySelector(SELECTORS.pageMain)

    if (pageMain) {
      gsap.set(pageMain, { opacity: 1 })
    }

    if (!loadComplete) {
      loadComplete = true
      resolveLoadPromise()
    }

    return () => {}
  }

  const parent = document.querySelector(SELECTORS.parent)

  hasPlayed = true
  loadComplete = false
  loadPromise = new Promise((resolve) => {
    resolveLoadPromise = resolve
  })

  if (!parent) {
    loadComplete = true
    resolveLoadPromise()
    return () => {}
  }

  const content = parent.querySelector(SELECTORS.content)
  const pageMain = root.querySelector(SELECTORS.pageMain) || document.querySelector(SELECTORS.pageMain)
  const loadTexts = gsap.utils.toArray(SELECTORS.text, parent)
  const line = parent.querySelector(SELECTORS.line)
  const progressLine = parent.querySelector(SELECTORS.progressLine) || line
  const hasSeparateProgressLine = progressLine && progressLine !== line
  const lineElements = [line, progressLine].filter(Boolean).filter((item, index, array) => array.indexOf(item) === index)
  const svgWrap = parent.querySelector(SELECTORS.svgWrap)
  const logoPaths = gsap.utils.toArray(SELECTORS.logoPath, parent)
  const videos = []
  const images = gsap.utils.toArray(SELECTORS.images, root).slice(0, MAX_LOAD_IMAGES)
  const splits = []
  const lines = []
  let activeTween = null
  let progressTween = null
  let isDestroyed = false

  const setProgress = (progress) => {
    if (!progressLine || isDestroyed) return

    progressTween?.kill()
    progressTween = gsap.to(progressLine, {
      [hasSeparateProgressLine ? 'width' : 'scaleX']: hasSeparateProgressLine ? `${Math.min(progress, 1) * 100}%` : Math.min(progress, 1),
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  const cleanup = () => {
    activeTween?.kill()
    progressTween?.kill()
    splits.forEach((split) => split.revert())
    splits.length = 0
    lenis.start()
  }

  const completeLoad = () => {
    if (loadComplete) return

    loadComplete = true
    resolveLoadPromise()
  }

  lenis.stop()

  gsap.set(parent, {
    display: 'flex',
    backgroundColor: '#000',
    opacity: 1,
    pointerEvents: 'auto',
    visibility: 'visible',
  })
  if (pageMain) {
    gsap.set(pageMain, { opacity: 0 })
  }
  if (content) {
    gsap.set(content, { display: 'flex' })
  }
  gsap.set(loadTexts, { autoAlpha: 0 })
  if (line) {
    gsap.set(line, {
      scaleX: 0,
      transformOrigin: 'left center',
    })
  }
  if (progressLine) {
    gsap.set(progressLine, {
      width: hasSeparateProgressLine ? '0%' : '100%',
      scaleX: hasSeparateProgressLine ? 1 : 0,
      transformOrigin: 'right center',
    })
  }
  if (svgWrap) {
    gsap.set(svgWrap, { opacity: 1 })
  }
  gsap.set(logoPaths, {
    scale: 0,
    transformOrigin: 'center center',
    willChange: 'transform',
  })

  loadTexts.forEach((text) => {
    const split = SplitText.create(text, {
      type: 'lines',
      mask: 'lines',
    })

    splits.push(split)
    lines.push(...split.lines)
  })

  gsap.set(lines, {
    yPercent: 100,
    opacity: 0,
    willChange: 'transform, opacity',
  })
  gsap.set(loadTexts, { autoAlpha: 1 })

  const playOutro = () => {
    if (isDestroyed) return

    gsap.set(lineElements, {
      transformOrigin: '100% 50%',
    })

    activeTween = gsap.timeline({
      onComplete: () => {
        if (content) {
          gsap.set(content, { display: 'none' })
        }
        if (pageMain) {
          gsap.set(pageMain, { opacity: 1 })
        }
        completeLoad()

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (isDestroyed) return

            gsap.to(parent, {
              opacity: 0,
              duration: 0.55,
              ease: 'power2.out',
              overwrite: true,
              onComplete: () => {
                if (isDestroyed) return

                gsap.set(parent, {
                  display: 'none',
                  opacity: 0,
                  pointerEvents: 'none',
                  visibility: 'hidden',
                })
                gsap.set(parent, { clearProps: 'backgroundColor' })
                cleanup()
              },
            })
          })
        })
      },
    })

    if (lineElements.length) {
      activeTween.to(lineElements, {
        scaleX: 0,
        transformOrigin: '100% 50%',
        duration: 0.5,
        ease: 'power3.inOut',
        overwrite: true,
      }, 0)
    }

    if (lines.length) {
      activeTween.to(lines, {
        yPercent: -110,
        opacity: 0,
        duration: 0.55,
        ease: 'power3.in',
        stagger: 0.035,
        overwrite: true,
      }, 0)
    }

    if (svgWrap) {
      activeTween.to(svgWrap, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
      }, 0)
    }
  }

  activeTween = gsap.timeline({
    onComplete: async () => {
      await waitForAssets(videos, images, setProgress)

      if (isDestroyed) return

      progressTween?.kill()

      if (!progressLine) {
        playOutro()
        return
      }

      gsap.to(progressLine, {
        [hasSeparateProgressLine ? 'width' : 'scaleX']: hasSeparateProgressLine ? '100%' : 1,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => {
          playOutro()
        },
      })
    },
  })

  if (lines.length) {
    activeTween.to(lines, {
      yPercent: 0,
      opacity: 1,
      duration: 0.85,
      ease: 'power3.out',
      stagger: 0.055,
      overwrite: true,
    }, 0)
  }

  if (line) {
    activeTween.to(line, {
      scaleX: 1,
      duration: 0.85,
      ease: 'power3.inOut',
      overwrite: true,
    }, 0)
  }

  if (logoPaths.length) {
    activeTween.to(logoPaths, {
      scale: 1,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.006,
      overwrite: true,
      onComplete: () => {
        gsap.set(logoPaths, { clearProps: 'willChange' })
      },
    }, 0)
  }

  return () => {
    isDestroyed = true
    activeTween?.kill()
    progressTween?.kill()
    if (pageMain) {
      gsap.set(pageMain, { opacity: 1 })
    }
    cleanup()
    completeLoad()
  }
}
