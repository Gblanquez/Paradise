const SELECTORS = {
  link: '[expertise="link"]',
  category: '[data-category]',
}

const PENDING_PROJECT_CATEGORY_KEY = 'pendingProjectCategory'

export function initExpertiseLinkAnimation(root = document) {
  if (!root?.addEventListener) return () => {}

  const storeCategory = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (!(event.target instanceof Element)) return

    const link = event.target.closest(SELECTORS.link)

    if (!link) return
    if (root !== document && !root.contains(link)) return

    const category = link.getAttribute('data-category')
      || link.querySelector(SELECTORS.category)?.getAttribute('data-category')
      || link.closest(SELECTORS.category)?.getAttribute('data-category')

    if (!category) return

    window.sessionStorage.setItem(PENDING_PROJECT_CATEGORY_KEY, category)
  }

  root.addEventListener('pointerdown', storeCategory, true)
  root.addEventListener('click', storeCategory, true)

  return () => {
    root.removeEventListener('pointerdown', storeCategory, true)
    root.removeEventListener('click', storeCategory, true)
  }
}
