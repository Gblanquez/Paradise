import gsap from 'gsap'
import { Flip } from 'gsap/Flip'

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

export function initProjectList(root = document) {
  const links = gsap.utils.toArray(SELECTORS.link, root)

  if (!links.length) return () => {}

  const list = root.querySelector(SELECTORS.list) || links[0].closest(SELECTORS.list)
  const items = links.map((link) => link.closest(SELECTORS.item) || link)
  const frames = items.map((item) => item.querySelector(SELECTORS.frame))
  const flipTargets = [...items, ...frames.filter(Boolean)]
  const cTextGroups = items.map((item) => gsap.utils.toArray(SELECTORS.cText, item))
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

  const applyCategoryLayout = (category) => {
    const isAll = category === 'all'
    let activeIndex = 0

    if (list) {
      list.classList.toggle('is-filtered', !isAll)
      if (isAll) {
        list.style.removeProperty('grid-template-columns')
      } else {
        list.style.gridTemplateColumns = 'repeat(16, 1fr)'
      }
    }

    links.forEach((link, index) => {
      const isActive = isAll || linkCategories[index] === category
      const item = items[index]
      const frame = frames[index]

      if (isAll) {
        item.classList.remove('is-active', 'is-inactive')
        item.style.removeProperty('grid-column')
        item.style.removeProperty('grid-row')
        item.style.removeProperty('z-index')
        frame?.style.removeProperty('width')
        frame?.style.removeProperty('height')
        return
      }

      if (isActive) {
        const row = Math.floor(activeIndex / 2) + 1
        const columnStart = activeIndex % 2 === 0 ? 1 : 6

        activeIndex += 1

        item.style.gridColumn = `${columnStart} / span 5`
        item.style.gridRow = String(row)
        item.style.zIndex = '2'
        item.classList.add('is-active')
        item.classList.remove('is-inactive')
        if (frame) {
          frame.style.width = FILTERED_FRAME_SIZES.active.width
          frame.style.height = FILTERED_FRAME_SIZES.active.height
        }
        return
      }

      item.style.gridColumn = '14 / 16'
      item.style.gridRow = '1'
      item.style.zIndex = '1'
      item.classList.add('is-inactive')
      item.classList.remove('is-active')
      if (frame) {
        frame.style.width = FILTERED_FRAME_SIZES.inactive.width
        frame.style.height = FILTERED_FRAME_SIZES.inactive.height
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
    list?.style.removeProperty('min-height')
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
      control.addEventListener('pointerenter', enter)
      control.addEventListener('pointerleave', leave)
      control.addEventListener('focus', enter)
      control.addEventListener('blur', leave)

      return () => {
        control.removeEventListener('click', click)
        control.removeEventListener('pointerenter', enter)
        control.removeEventListener('pointerleave', leave)
        control.removeEventListener('focus', enter)
        control.removeEventListener('blur', leave)
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
      control.addEventListener('pointerenter', enter)
      control.addEventListener('pointerleave', leave)
      control.addEventListener('focus', enter)
      control.addEventListener('blur', leave)

      return () => {
        control.removeEventListener('click', click)
        control.removeEventListener('pointerenter', enter)
        control.removeEventListener('pointerleave', leave)
        control.removeEventListener('focus', enter)
        control.removeEventListener('blur', leave)
      }
    }),
  ]

  gsap.set(categoryLines, {
    scaleX: 0,
    transformOrigin: 'left center',
  })

  setCategoryState('all', true)

  return () => {
    activeFlip?.kill()
    removeCategoryListeners.forEach((remove) => remove())
    categoryButtons.forEach((button) => {
      button.classList.remove('is-active')
      button.removeAttribute('aria-pressed')
    })
    list?.classList.remove('is-filtered')
    list?.style.removeProperty('grid-template-columns')
    items.forEach((item, index) => {
      item.classList.remove('is-active', 'is-inactive')
      item.style.removeProperty('grid-column')
      item.style.removeProperty('grid-row')
      item.style.removeProperty('z-index')
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
