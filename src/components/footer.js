import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  footer: '[data="footer"]',
  footerFallback: '#contact',
  trigger: '[data-a="foot-trigger"]',
}

function isUsableElement(element) {
  if (!element?.isConnected) return false

  const style = window.getComputedStyle(element)

  return style.display !== 'none' && style.visibility !== 'hidden'
}

function queryScoped(root, selector, allowDocumentFallback = false) {
  if (!root?.querySelector) return null
  if (root !== document && root.matches?.(selector)) return root

  const scopedElement = root.querySelector(selector)

  if (scopedElement || !allowDocumentFallback) return scopedElement

  const candidates = gsap.utils.toArray(selector, document).filter(isUsableElement)

  return candidates[candidates.length - 1] || null
}

export function initFooter(root = document) {
  const footer = queryScoped(root, SELECTORS.footer) || queryScoped(root, SELECTORS.footerFallback)
  const trigger = queryScoped(root, SELECTORS.trigger)
    || footer?.previousElementSibling

  if (!footer || !trigger) return () => {}

  footer._paradiseFooterDestroy?.()

  const scrubTimeline = gsap.timeline({
    scrollTrigger: {
      trigger,
      start: 'bottom bottom',
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true,
    },
  })

  scrubTimeline.fromTo(footer,
    { y: '30%' },
    {
      y: '0%',
      ease: 'none',
    }
  )

  requestAnimationFrame(() => ScrollTrigger.refresh())

  const destroy = () => {
    scrubTimeline?.scrollTrigger?.kill()
    scrubTimeline?.kill()
    if (footer._paradiseFooterDestroy === destroy) {
      gsap.set(footer, { clearProps: 'transform' })
    }
    if (footer._paradiseFooterDestroy === destroy) {
      delete footer._paradiseFooterDestroy
    }
  }

  footer._paradiseFooterDestroy = destroy

  return destroy
}
