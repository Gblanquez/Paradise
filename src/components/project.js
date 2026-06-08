import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { canUseHover } from './hoverSupport.js'

gsap.registerPlugin(Flip)

const SELECTORS = {
  list: '.wk-collection-list',
  item: '.wk-collection-item',
  link: '.wk-link',
  frame: '.ft-project-parent',
  cText: '[data-a="c-text"]',
  category: '[data-category]',
  allCategory: '[data="all-category"]',
  categoryItem: '.category-list-item',
  categoryLine: '.category-line',
  mobileInactive: '[data-a="mob-inactive"]',
}

const FILTERED_FRAME_SIZES = {
  active: {
    width: '40vw',
    height: '22vw',
  },
  inactive: {
    width: '12vw',
    height: '6vw',
  },
}

const MOBILE_FILTER_QUERY = '(max-width: 780px)'

function normalizeCategory(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

function getCategoryText(element) {
  if (!element) return ''

  const clone = element.cloneNode(true)

  clone.querySelectorAll(SELECTORS.categoryLine).forEach((line) => line.remove())

  return clone.textContent || ''
}

function getExplicitCategory(element) {
  if (!element) return ''

  const value = element.getAttribute('data-category')

  if (value) return value

  const child = element.querySelector?.(SELECTORS.category)

  return child?.getAttribute('data-category') || ''
}

function getCategoryValue(element) {
  return normalizeCategory(getExplicitCategory(element) || getCategoryText(element))
}

function getCategoryControl(element) {
  return element.closest(SELECTORS.categoryItem) || element
}

function getCategoryLines(trigger, control) {
  const lines = [
    ...gsap.utils.toArray(SELECTORS.categoryLine, control),
    ...gsap.utils.toArray(SELECTORS.categoryLine, trigger),
    ...gsap.utils.toArray(SELECTORS.categoryLine, trigger.parentElement || trigger),
  ]

  return [...new Set(lines)]
}

function notifyProjectsLayoutReady() {
  window.dispatchEvent(new CustomEvent('projects:layout-ready'))
}

export function initProjectList(root = document) {
  const supportsHover = canUseHover()
  const mobileFilterMedia = window.matchMedia(MOBILE_FILTER_QUERY)
  const links = gsap.utils.toArray(SELECTORS.link, root)

  if (!links.length) return () => {}

  const list = root.querySelector(SELECTORS.list) || links[0].closest(SELECTORS.list)
  const items = links.map((link) => link.closest(SELECTORS.item) || link)
  const frames = items.map((item) => item.querySelector(SELECTORS.frame))
  const flipTargets = [...items, ...frames.filter(Boolean)]
  const cTextGroups = items.map((item) => gsap.utils.toArray(SELECTORS.cText, item))
  const originalTabIndexes = links.map((link) => link.getAttribute('tabindex'))
  const linkCategories = links.map((link, index) => (
    getCategoryValue(link)
    || getCategoryValue(items[index])
  ))
  const categoryTriggers = gsap.utils.toArray(SELECTORS.category, root)
    .filter((trigger) => !links.some((link) => link === trigger || link.contains(trigger) || trigger.contains(link)))
    .filter((trigger) => !items.some((item) => item === trigger || item.contains(trigger) || trigger.contains(item)))
  const allCategoryTriggers = gsap.utils.toArray(SELECTORS.allCategory, root)
  const createCategoryEntry = (trigger, value) => {
    const control = getCategoryControl(trigger)

    return {
      trigger,
      control,
      lines: getCategoryLines(trigger, control),
      value,
    }
  }

  const categoryEntries = categoryTriggers.map((trigger) => (
    createCategoryEntry(trigger, getCategoryValue(trigger))
  ))
  const allCategoryEntries = allCategoryTriggers.map((trigger) => (
    createCategoryEntry(trigger, 'all')
  ))
  const categoryEntriesAll = [...allCategoryEntries, ...categoryEntries]
  const categoryButtons = categoryEntriesAll.map(({ control }) => control)
  const categoryLines = [...new Set(categoryEntriesAll.flatMap(({ lines }) => lines))]

  let activeCategory = 'all'
  let activeFlip = null

  const isMobileFilterLayout = () => mobileFilterMedia.matches

  const moveItemToList = (item, index) => {
    if (!list) return

    const nextItem = items
      .slice(index + 1)
      .find((candidate) => candidate.parentElement === list)

    list.insertBefore(item, nextItem || null)
  }

  const handleFilterBreakpointChange = () => {
    applyCategoryLayout(activeCategory)
    notifyProjectsLayoutReady()
  }

  const setLinkInteractive = (link, isInteractive) => {
    link.setAttribute('aria-disabled', String(!isInteractive))

    if (isInteractive) {
      link.style.removeProperty('pointer-events')
      const originalTabIndex = originalTabIndexes[links.indexOf(link)]

      if (originalTabIndex === null) {
        link.removeAttribute('tabindex')
      } else {
        link.setAttribute('tabindex', originalTabIndex)
      }
    } else {
      link.style.pointerEvents = 'none'
      link.setAttribute('tabindex', '-1')
    }
  }

  const applyCategoryLayout = (category) => {
    const isAll = category === 'all'
    let activeIndex = 0

    if (list) {
      list.classList.toggle('is-filtered', !isAll)
      if (isAll) {
        list.style.removeProperty('display')
        list.style.removeProperty('grid-template-columns')
        list.style.removeProperty('column-gap')
      } else {
        const isMobile = isMobileFilterLayout()

        list.style.display = 'grid'
        list.style.gridTemplateColumns = isMobile
          ? 'repeat(6, minmax(0, 1fr))'
          : 'repeat(16, minmax(0, 1fr))'
        if (isMobile) {
          list.style.columnGap = '1rem'
        } else {
          list.style.removeProperty('column-gap')
        }
      }
    }

    links.forEach((link, index) => {
      const isActive = isAll || linkCategories[index] === category
      const item = items[index]
      const frame = frames[index]
      const isMobile = isMobileFilterLayout()

      if (isAll) {
        moveItemToList(item, index)
        setLinkInteractive(link, true)
        item.classList.remove('is-active', 'is-inactive')
        item.style.removeProperty('pointer-events')
        item.style.removeProperty('grid-column')
        item.style.removeProperty('grid-row')
        item.style.removeProperty('z-index')
        item.style.removeProperty('min-width')
        frame?.style.removeProperty('width')
        frame?.style.removeProperty('height')
        return
      }

      if (isActive) {
        moveItemToList(item, index)
        setLinkInteractive(link, true)
        const row = isMobile ? activeIndex + 1 : Math.floor(activeIndex / 2) + 1
        const columnStart = isMobile
          ? 1
          : (activeIndex % 2 === 0 ? 1 : 6)
        const columnSpan = isMobile ? 5 : 5

        activeIndex += 1

        item.style.gridColumn = isMobile
          ? '1 / 6'
          : `${columnStart} / span ${columnSpan}`
        item.style.gridRow = String(row)
        item.style.zIndex = '2'
        item.style.minWidth = '0'
        item.style.removeProperty('pointer-events')
        item.classList.add('is-active')
        item.classList.remove('is-inactive')
        if (frame) {
          if (isMobile) {
            frame.style.removeProperty('width')
            frame.style.height = '18rem'
          } else {
            frame.style.width = FILTERED_FRAME_SIZES.active.width
            frame.style.height = FILTERED_FRAME_SIZES.active.height
          }
        }
        return
      }

      if (isMobile) {
        moveItemToList(item, index)
        item.style.gridColumn = '6 / 7'
        item.style.gridRow = '1'
      } else {
        moveItemToList(item, index)
        item.style.gridColumn = '14 / 16'
        item.style.gridRow = '1'
      }

      item.style.zIndex = '1'
      item.style.minWidth = '0'
      item.style.pointerEvents = 'none'
      setLinkInteractive(link, false)
      item.classList.add('is-inactive')
      item.classList.remove('is-active')
      if (frame) {
        if (isMobile) {
          frame.style.removeProperty('width')
          frame.style.height = '4rem'
        } else {
          frame.style.width = FILTERED_FRAME_SIZES.inactive.width
          frame.style.height = FILTERED_FRAME_SIZES.inactive.height
        }
      }
    })
  }

  const getCategoryTexts = (category) => {
    const isAll = category === 'all'
    const activeTexts = []
    const inactiveTexts = []

    cTextGroups.forEach((texts, index) => {
      if (isAll || linkCategories[index] === category) {
        activeTexts.push(...texts)
      } else {
        inactiveTexts.push(...texts)
      }
    })

    return {
      activeTexts,
      inactiveTexts,
    }
  }

  const animateCategoryText = (category, immediate = false) => {
    const { activeTexts, inactiveTexts } = getCategoryTexts(category)

    gsap.to(activeTexts, {
      y: '0%',
      opacity: 1,
      duration: immediate ? 0 : 0.45,
      ease: 'power3.out',
      stagger: immediate ? 0 : 0.015,
      overwrite: true,
    })

    gsap.to(inactiveTexts, {
      y: '100%',
      opacity: 0,
      duration: immediate ? 0 : 0.5,
      ease: 'power3.inOut',
      stagger: immediate ? 0 : 0.025,
      overwrite: true,
    })
  }

  const setCategoryLine = (lines, isActive, immediate = false) => {
    if (!lines.length) return

    gsap.to(lines, {
      scaleX: isActive ? 1 : 0,
      duration: immediate ? 0 : 0.45,
      ease: 'power3.out',
      overwrite: true,
    })
  }

  const setCategoryState = (category, immediate = false) => {
    const nextCategory = category || 'all'

    if (!immediate && nextCategory === activeCategory) return

    activeFlip?.kill()
    const currentListHeight = list?.getBoundingClientRect().height || 0
    const state = !immediate ? Flip.getState(flipTargets) : null
    const { activeTexts, inactiveTexts } = getCategoryTexts(nextCategory)

    activeCategory = nextCategory
    gsap.to(inactiveTexts, {
      y: '100%',
      opacity: 0,
      duration: immediate ? 0 : 0.32,
      ease: 'power3.inOut',
      stagger: immediate ? 0 : 0.02,
      overwrite: true,
    })

    applyCategoryLayout(activeCategory)
    const nextListHeight = list?.getBoundingClientRect().height || 0

    if (state && list) {
      list.style.minHeight = `${Math.max(currentListHeight, nextListHeight)}px`
    }

    if (immediate) {
      animateCategoryText(activeCategory, true)
    }

    if (state) {
      activeFlip = Flip.from(state, {
        duration: 0.9,
        ease: 'power3.inOut',
        absolute: items,
        nested: true,
        stagger: {
          each: 0.025,
          from: activeCategory === 'all' ? 'end' : 'start',
        },
        overwrite: true,
        onComplete: () => {
          list?.style.removeProperty('min-height')
          notifyProjectsLayoutReady()
          gsap.to(activeTexts, {
            y: '0%',
            opacity: 1,
            duration: 0.42,
            ease: 'power3.out',
            stagger: 0.015,
            overwrite: true,
          })
          activeFlip = null
        },
      })
    } else if (!immediate) {
      gsap.to(activeTexts, {
        y: '0%',
        opacity: 1,
        duration: 0.42,
        ease: 'power3.out',
          stagger: 0.015,
          overwrite: true,
          onComplete: notifyProjectsLayoutReady,
        })
      }

    categoryEntries.forEach(({ control, lines, value }) => {
      const isActive = value === activeCategory

      control.classList.toggle('is-active', isActive)
      control.setAttribute('aria-pressed', String(isActive))
      setCategoryLine(lines, isActive, immediate)
    })

    allCategoryEntries.forEach(({ control, lines }) => {
      const isActive = activeCategory === 'all'

      control.classList.toggle('is-active', isActive)
      control.setAttribute('aria-pressed', String(isActive))
      setCategoryLine(lines, isActive, immediate)
    })
  }

  const removeCategoryListeners = [
    ...categoryEntries.map(({ control, lines, value }) => {
      const click = (event) => {
        event.preventDefault()
        setCategoryState(value)
      }
      const enter = () => setCategoryLine(lines, true)
      const leave = () => setCategoryLine(lines, value === activeCategory)

      control.addEventListener('click', click)
      if (supportsHover) {
        control.addEventListener('pointerenter', enter)
        control.addEventListener('pointerleave', leave)
        control.addEventListener('focus', enter)
        control.addEventListener('blur', leave)
      }

      return () => {
        control.removeEventListener('click', click)
        if (supportsHover) {
          control.removeEventListener('pointerenter', enter)
          control.removeEventListener('pointerleave', leave)
          control.removeEventListener('focus', enter)
          control.removeEventListener('blur', leave)
        }
      }
    }),
    ...allCategoryEntries.map(({ control, lines }) => {
      const click = (event) => {
        event.preventDefault()
        setCategoryState('all')
      }
      const enter = () => setCategoryLine(lines, true)
      const leave = () => setCategoryLine(lines, activeCategory === 'all')

      control.addEventListener('click', click)
      if (supportsHover) {
        control.addEventListener('pointerenter', enter)
        control.addEventListener('pointerleave', leave)
        control.addEventListener('focus', enter)
        control.addEventListener('blur', leave)
      }

      return () => {
        control.removeEventListener('click', click)
        if (supportsHover) {
          control.removeEventListener('pointerenter', enter)
          control.removeEventListener('pointerleave', leave)
          control.removeEventListener('focus', enter)
          control.removeEventListener('blur', leave)
        }
      }
    }),
  ]

  gsap.set(categoryLines, {
    scaleX: 0,
    transformOrigin: 'left center',
  })

  setCategoryState('all', true)
  mobileFilterMedia.addEventListener?.('change', handleFilterBreakpointChange)

  return () => {
    activeFlip?.kill()
    mobileFilterMedia.removeEventListener?.('change', handleFilterBreakpointChange)
    removeCategoryListeners.forEach((remove) => remove())
    categoryButtons.forEach((button) => {
      button.classList.remove('is-active')
      button.removeAttribute('aria-pressed')
    })
    list?.classList.remove('is-filtered')
    list?.style.removeProperty('display')
    list?.style.removeProperty('grid-template-columns')
    list?.style.removeProperty('column-gap')
    list?.style.removeProperty('min-height')
    items.forEach((item, index) => {
      moveItemToList(item, index)
      setLinkInteractive(links[index], true)
      item.classList.remove('is-active', 'is-inactive')
      item.style.removeProperty('grid-column')
      item.style.removeProperty('grid-row')
      item.style.removeProperty('z-index')
      item.style.removeProperty('min-width')
      frames[index]?.style.removeProperty('width')
      frames[index]?.style.removeProperty('height')
    })
    gsap.set(links, { clearProps: 'opacity,transform' })
    gsap.set(cTextGroups.flat(), { clearProps: 'opacity,transform' })
    gsap.set(categoryLines, {
      clearProps: 'transform,transformOrigin',
    })
  }
}
