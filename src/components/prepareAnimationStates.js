import { gsap } from 'gsap'

export function prepareAnimationStates(root = document) {
  const textRevealTargets = gsap.utils.toArray('[data-a="title-text"], [data-a="body-text"]', root)
  const lines = gsap.utils.toArray('.line', root)
  const heroVideoMasks = gsap.utils.toArray('[data-a="video-mask"]', root)
  const imageTriggers = gsap.utils.toArray('[data-a="trigger"]', root)
  const whyLines = gsap.utils.toArray('[data-a="why-line"]', root)
  const talentBoxes = gsap.utils.toArray('.talent-box-wrapper', root)

  gsap.set(textRevealTargets, { autoAlpha: 0 })

  gsap.set(lines, {
    scaleX: 0,
    transformOrigin: 'top right',
  })

  gsap.set(heroVideoMasks, {
    scale: 1.2,
    rotation: -20,
    clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
    transformOrigin: 'center center',
  })

  imageTriggers.forEach((trigger) => {
    const imgWrapper = trigger.querySelector('[data-a="mask-project"]')
    const imgItem = trigger.querySelector('[data-a="scale"]')

    gsap.set(imgWrapper || [], {
      overflow: 'hidden',
      clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
      transformOrigin: '50% 50%',
    })

    gsap.set(imgItem || [], {
      scale: 1.2,
      y: '0%',
      transformOrigin: '50% 50%',
    })
  })

  gsap.set(whyLines, {
    scaleY: 0,
    transformOrigin: 'top center',
  })

  gsap.set(talentBoxes, {
    opacity: 0,
    rotation: -45,
    transformOrigin: 'top right',
  })
}
