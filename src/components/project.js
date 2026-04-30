import gsap from 'gsap'

const SELECTORS = {
  link: '.wk-link',
  linkHoverBox: '.lk-hover-box',
  videoItem: '.wk-video-item',
  videoChild: '.wk-video-child',
  video: '.main-thumbnail-video',
  projectNumber: '[data-a="project-number"]',
  videoTime: '[data-a="video-time"]',
}

function formatIndex(index, padLength) {
  return String(index + 1).padStart(padLength, '0')
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

function getPadLength(links) {
  const existingLength = links.reduce((longest, link) => {
    const numberEl = link.querySelector(SELECTORS.projectNumber)

    return Math.max(longest, numberEl?.textContent.trim().length || 0)
  }, 0)

  return Math.max(String(links.length).length, existingLength)
}

export function initProjectList(root = document) {
  const links = gsap.utils.toArray(SELECTORS.link, root)
  const videoItems = gsap.utils.toArray(SELECTORS.videoItem, root)

  if (!links.length || !videoItems.length) return () => {}

  const linksParent = links[0].parentElement
  const videoChildren = videoItems.map((item) => item.querySelector(SELECTORS.videoChild) || item)
  const videos = videoItems.map((item) => item.querySelector(SELECTORS.video))
  const hoverBoxes = links.map((link) => gsap.utils.toArray(SELECTORS.linkHoverBox, link))
  const allHoverBoxes = hoverBoxes.flat()
  const setVideoItemOpacity = videoItems.map((item) => gsap.quickSetter(item, 'opacity'))
  const padLength = getPadLength(links)
  const removeMetadataListeners = []
  const revealTweens = new Set()
  const childTweens = new WeakMap()
  let activeIndex = -1
  let activeTransition = 0
  let zIndex = videoItems.length

  const setProjectNumbers = () => {
    links.forEach((link, index) => {
      const numberEl = link.querySelector(SELECTORS.projectNumber)

      if (numberEl) {
        numberEl.textContent = formatIndex(index, padLength)
      }
    })
  }

  const setVideoTime = (index) => {
    const video = videos[index]
    const timeEl = links[index]?.querySelector(SELECTORS.videoTime)

    if (!video || !timeEl) return

    timeEl.textContent = formatTime(video.duration)
  }

  const setVideoTimes = () => {
    videos.forEach((video, index) => {
      if (!video) return

      video.preload = 'metadata'

      if (video.readyState >= 1) {
        setVideoTime(index)
        return
      }

      const updateTime = () => setVideoTime(index)

      video.addEventListener('loadedmetadata', updateTime, { once: true })
      removeMetadataListeners.push(() => video.removeEventListener('loadedmetadata', updateTime))
      video.load()
    })
  }

  const showVideo = (nextIndex, immediate = false) => {
    const index = gsap.utils.wrap(0, videoItems.length, nextIndex)

    if (index === activeIndex) return

    activeTransition += 1
    zIndex += 1

    const transition = activeTransition
    const currentChildTween = childTweens.get(videoChildren[index])

    currentChildTween?.kill()

    videoItems[index].style.zIndex = String(zIndex)
    setVideoItemOpacity[index](1)

    gsap.set(videoChildren[index], {
      clipPath: immediate ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)',
    })

    const revealTween = gsap.to(videoChildren[index], {
      clipPath: 'inset(0 0 0 0%)',
      duration: immediate ? 0 : 0.8,
      ease: 'power3.inOut',
      onComplete: () => {
        revealTweens.delete(revealTween)
        childTweens.delete(videoChildren[index])

        if (transition !== activeTransition) return

        videoItems.forEach((item, itemIndex) => {
          if (itemIndex === index) {
            item.style.zIndex = String(videoItems.length)
            setVideoItemOpacity[itemIndex](1)
            return
          }

          item.style.zIndex = '0'
          setVideoItemOpacity[itemIndex](0)
        })

        zIndex = videoItems.length
      },
    })

    revealTweens.add(revealTween)
    childTweens.set(videoChildren[index], revealTween)
    activeIndex = index
  }

  const onLinkEnter = (index) => {
    showVideo(index)
    showHoverBox(index)
  }

  const showHoverBox = (activeHoverIndex) => {
    hoverBoxes.forEach((boxes, index) => {
      if (!boxes.length) return

      gsap.to(boxes, {
        width: index === activeHoverIndex ? '100%' : '0%',
        height: '100%',
        duration: 0.45,
        ease: 'power3.out',
        overwrite: true,
      })
    })
  }

  const removeListeners = links.map((link, index) => {
    const enter = () => onLinkEnter(index)

    link.addEventListener('pointerenter', enter)
    link.addEventListener('focus', enter)

    return () => {
      link.removeEventListener('pointerenter', enter)
      link.removeEventListener('focus', enter)
    }
  })

  const onLinksLeave = () => {
    showVideo(0)
    showHoverBox(-1)
  }

  linksParent?.addEventListener('pointerleave', onLinksLeave)

  gsap.set(videoChildren, {
    willChange: 'clip-path',
  })

  gsap.set(allHoverBoxes, {
    width: '0%',
    height: '100%',
  })

  setProjectNumbers()
  setVideoTimes()
  showVideo(0, true)

  return () => {
    revealTweens.forEach((tween) => tween.kill())
    revealTweens.clear()
    removeListeners.forEach((remove) => remove())
    linksParent?.removeEventListener('pointerleave', onLinksLeave)
    removeMetadataListeners.forEach((remove) => remove())
    gsap.set(allHoverBoxes, { clearProps: 'width,height' })
    gsap.set(videoItems, { clearProps: 'opacity,zIndex' })
    gsap.set(videoChildren, { clearProps: 'clipPath,willChange' })
  }
}
