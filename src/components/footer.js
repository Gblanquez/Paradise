import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll.js'

gsap.registerPlugin(ScrollTrigger)

const SELECTORS = {
  footer: '[data="footer"]',
  footerFallback: '#contact',
  pageMain: '.page-main',
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
  const footer = queryScoped(root, SELECTORS.footer, true) || queryScoped(root, SELECTORS.footerFallback, true)
  const trigger = queryScoped(root, SELECTORS.trigger, true)
    || footer?.previousElementSibling

  if (!footer || !trigger) return () => {}

  footer._paradiseFooterDestroy?.()

  let scrubTimeline = null
  let refreshFrame = null
  let refreshTimer = null
  let createFrame = null
  let createAttempts = 0
  let isDestroyed = false

  const refreshFooter = () => {
    if (isDestroyed) return
    if (refreshFrame) window.cancelAnimationFrame(refreshFrame)
    if (refreshTimer) window.clearTimeout(refreshTimer)

    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh()
        refreshTimer = window.setTimeout(() => {
          ScrollTrigger.refresh()
        }, 120)
      })
    })
  }

  const createTriggers = () => {
    if (isDestroyed) return
    const rect = footer.getBoundingClientRect()

    if ((!rect.width || !rect.height) && createAttempts < 90) {
      createAttempts += 1
      createFrame = window.requestAnimationFrame(createTriggers)
      return
    }

    scrubTimeline?.scrollTrigger?.kill()
    scrubTimeline?.kill()

    scrubTimeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: 'bottom bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    })

    scrubTimeline.fromTo(footer,
      { y: '20%' },
      {
        y: '0%',
        ease: 'none',
      }
    )

    refreshFooter()
  }

  const removeScrollListener = addScrollListener(() => ScrollTrigger.update())
  window.addEventListener('page:entered', refreshFooter)
  window.addEventListener('projects:layout-ready', refreshFooter)
  window.addEventListener('load', refreshFooter)
  createFrame = window.requestAnimationFrame(createTriggers)

  const destroy = () => {
    isDestroyed = true
    removeScrollListener()
    window.removeEventListener('page:entered', refreshFooter)
    window.removeEventListener('projects:layout-ready', refreshFooter)
    window.removeEventListener('load', refreshFooter)
    if (createFrame) window.cancelAnimationFrame(createFrame)
    if (refreshFrame) window.cancelAnimationFrame(refreshFrame)
    if (refreshTimer) window.clearTimeout(refreshTimer)
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

export function ensureFooterSticky(root = document) {
  const footers = [
    queryScoped(root, SELECTORS.footer, true),
    queryScoped(root, SELECTORS.footerFallback, true),
  ].filter(Boolean)

  ;[...new Set(footers)].forEach((footer) => {
    footer.style.position = 'sticky'
    footer.style.bottom = '0'
  })
}
