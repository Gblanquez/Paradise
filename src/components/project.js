import gsap from 'gsap'
import { canUseHover } from './hoverSupport.js'

const SELECTORS = {
  list: '.wk-collection-list',
  item: '.wk-collection-item',
  link: '.wk-link',
  frame: '.ft-project-parent',
  maskProject: '[data-a="mask-project"]',
  scaleProject: '[data-a="scale"]',
  cText: '[data-a="c-text"]',
  category: '[data-category]',
  allCategory: '[data="all-category"]',
  categoryItem: '.category-list-item',
  categoryLine: '.category-line',
  mobileInactive: '[data-a="mob-inactive"]',
}

const MOBILE_FILTER_QUERY = '(max-width: 780px)'
const PENDING_PROJECT_CATEGORY_KEY = 'pendingProjectCategory'

function normalizeCategory(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

function splitCategoryValue(value) {
  return String(value || '')
    .split(/[,|;/]+/)
    .map(normalizeCategory)
    .filter(Boolean)
}

function getCategoryText(element) {
  if (!element) return ''

  const clone = element.cloneNode(true)

  clone.querySelectorAll(SELECTORS.categoryLine).forEach((line) => line.remove())

  return clone.textContent || ''
}

function getExplicitCategories(element) {
  if (!element) return []

  const values = []

  const value = element.getAttribute('data-category')

  if (value) {
    values.push(...splitCategoryValue(value))
  }

  const children = gsap.utils.toArray(SELECTORS.category, element)

  children.forEach((child) => {
    const childValue = child.getAttribute('data-category')

    if (childValue) {
      values.push(...splitCategoryValue(childValue))
    }
  })

  return [...new Set(values)]
}

function getCategoryValue(element) {
  return normalizeCategory(getExplicitCategories(element)[0] || getCategoryText(element))
}

function getCategoryValues(element) {
  const explicitCategories = getExplicitCategories(element)

  if (explicitCategories.length) return explicitCategories

  return splitCategoryValue(getCategoryText(element))
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

function getPendingProjectCategory() {
  const value = window.sessionStorage.getItem(PENDING_PROJECT_CATEGORY_KEY)
  const params = new URLSearchParams(window.location.search)
  const queryValue = params.get('category') || params.get('filter')

  if (value) {
    window.sessionStorage.removeItem(PENDING_PROJECT_CATEGORY_KEY)
  }

  return normalizeCategory(value || queryValue || '')
}

function setStyle(element, property, value, priority = '') {
  element?.style.setProperty(property, value, priority)
}

export function initProjectList(root = document) {
  const supportsHover = canUseHover()
  const mobileFilterMedia = window.matchMedia(MOBILE_FILTER_QUERY)
  const links = gsap.utils.toArray(SELECTORS.link, root)

  if (!links.length) return () => {}

  const list = root.querySelector(SELECTORS.list) || links[0].closest(SELECTORS.list)
  const items = links.map((link) => link.closest(SELECTORS.item) || link)
  const frames = items.map((item) => item.querySelector(SELECTORS.frame))
  const projectMasks = items.map((item) => item.querySelector(SELECTORS.maskProject)).filter(Boolean)
  const projectScales = items.map((item) => item.querySelector(SELECTORS.scaleProject)).filter(Boolean)
  const cTextGroups = items.map((item) => gsap.utils.toArray(SELECTORS.cText, item))
  const projectCategoryGroups = items.map((item) => gsap.utils.toArray(SELECTORS.category, item))
  const originalTabIndexes = links.map((link) => link.getAttribute('tabindex'))
  const linkCategories = links.map((link, index) => {
    const categories = [
      ...getCategoryValues(link),
      ...getCategoryValues(items[index]),
    ]

    return [...new Set(categories)]
  })
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

  const isMobileFilterLayout = () => {
    const listWidth = list?.getBoundingClientRect().width || 0

    if (listWidth) return listWidth <= 780

    return mobileFilterMedia.matches
  }

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

  const setProjectCategoryLabels = (category) => {
    const isAll = category === 'all'

    projectCategoryGroups.forEach((categoryLabels) => {
      categoryLabels.forEach((label) => {
        const isSelected = isAll || getCategoryValues(label).includes(category)

        label.style.display = isSelected ? '' : 'none'
      })
    })
  }

  const applyCategoryLayout = (category) => {
    const isAll = category === 'all'

    if (list) {
      list.classList.toggle('is-filtered', !isAll)
      if (isAll) {
        list.style.removeProperty('display')
        list.style.removeProperty('grid-template-columns')
        list.style.removeProperty('column-gap')
      } else {
        const isMobile = isMobileFilterLayout()

        setStyle(list, 'display', 'grid', 'important')
        setStyle(list, 'grid-template-columns', isMobile
          ? '1fr'
          : 'repeat(2, minmax(0, 1fr))', 'important')
        setStyle(list, 'column-gap', '1rem', 'important')
      }
    }

    links.forEach((link, index) => {
      const isActive = isAll || linkCategories[index].includes(category)
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
        item.style.removeProperty('display')
        frame?.style.removeProperty('width')
        frame?.style.removeProperty('height')
        return
      }

      if (isActive) {
        moveItemToList(item, index)
        setLinkInteractive(link, true)
        item.style.removeProperty('display')
        item.style.removeProperty('grid-column')
        item.style.removeProperty('grid-row')
        item.style.zIndex = '2'
        item.style.minWidth = '0'
        item.style.removeProperty('pointer-events')
        item.classList.add('is-active')
        item.classList.remove('is-inactive')
        frame?.style.removeProperty('width')
        frame?.style.removeProperty('height')
        return
      }

      item.style.display = 'none'
      item.style.removeProperty('grid-column')
      item.style.removeProperty('grid-row')
      item.style.removeProperty('z-index')
      item.style.removeProperty('min-width')
      item.style.pointerEvents = 'none'
      setLinkInteractive(link, false)
      item.classList.add('is-inactive')
      item.classList.remove('is-active')
      frame?.style.removeProperty('width')
      frame?.style.removeProperty('height')
    })
  }

  const getCategoryTexts = (category) => {
    const isAll = category === 'all'
    const activeTexts = []
    const inactiveTexts = []

    cTextGroups.forEach((texts, index) => {
      if (isAll || linkCategories[index].includes(category)) {
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

  const revealProjectMasks = (immediate = false) => {
    gsap.to(projectMasks, {
      '--mask-x': '0%',
      '--mask-y': '0%',
      '--mask-radius': '0rem',
      duration: immediate ? 0 : 0.45,
      ease: 'power3.out',
      overwrite: true,
    })

    gsap.to(projectScales, {
      scale: 1,
      duration: immediate ? 0 : 0.45,
      ease: 'power3.out',
      overwrite: true,
    })
  }

  const setCategoryState = (category, immediate = false) => {
    const nextCategory = category || 'all'

    if (!immediate && nextCategory === activeCategory) return

    if (!immediate) {
      revealProjectMasks()
    }

    const { activeTexts, inactiveTexts } = getCategoryTexts(nextCategory)

    activeCategory = nextCategory
    setProjectCategoryLabels(activeCategory)
    gsap.to(inactiveTexts, {
      y: '100%',
      opacity: 0,
      duration: immediate ? 0 : 0.32,
      ease: 'power3.inOut',
      stagger: immediate ? 0 : 0.02,
      overwrite: true,
    })

    applyCategoryLayout(activeCategory)

    if (immediate) {
      animateCategoryText(activeCategory, true)
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

  const pendingCategory = getPendingProjectCategory()
  const initialCategory = pendingCategory && linkCategories.some((categories) => categories.includes(pendingCategory))
    ? pendingCategory
    : 'all'

  setCategoryState(initialCategory, true)
  mobileFilterMedia.addEventListener?.('change', handleFilterBreakpointChange)

  return () => {
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
      item.style.removeProperty('display')
      frames[index]?.style.removeProperty('width')
      frames[index]?.style.removeProperty('height')
    })
    projectCategoryGroups.flat().forEach((label) => {
      label.style.removeProperty('display')
    })
    gsap.set(links, { clearProps: 'opacity,transform' })
    gsap.set(cTextGroups.flat(), { clearProps: 'opacity,transform' })
    gsap.set(categoryLines, {
      clearProps: 'transform,transformOrigin',
    })
  }
}
