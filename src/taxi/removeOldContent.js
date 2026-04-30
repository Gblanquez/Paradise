export function removeOldContent(wrapper, currentContent) {
  if (!wrapper || !currentContent) return

  Array.from(wrapper.children).forEach((child) => {
    if (child !== currentContent) {
      child.remove()
    }
  })

  wrapper.querySelectorAll('[data-taxi-view]').forEach((view) => {
    if (view !== currentContent && !currentContent.contains(view)) {
      view.remove()
    }
  })

  document.querySelectorAll('[data-work-carrousel-spacer]').forEach((spacer) => {
    if (!currentContent.contains(spacer)) {
      spacer.remove()
    }
  })
}
