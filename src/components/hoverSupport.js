export function canUseHover() {
  return window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
}
