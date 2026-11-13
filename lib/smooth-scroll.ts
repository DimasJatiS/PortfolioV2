import type Lenis from "lenis";

/**
 * The one Lenis instance (created by `components/dom/SmoothScroll`). Lenis only
 * smooths native scrolling, so everything also works when it is absent: before
 * it starts, with reduced motion (Lenis then tracks input 1:1), or if it fails.
 */
let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** `ease-inout` (cubic-bezier(0.65, 0, 0.35, 1)), close enough as a cubic. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Seconds; `snap-dur` (Spesifikasi Lanjutan 1.1). */
const SCROLL_DURATION = 0.6;

/** Scroll the window to `y`, smoothly unless `immediate`. */
export function scrollToY(y: number, { immediate = false }: { immediate?: boolean } = {}): void {
  if (instance) {
    instance.scrollTo(y, { immediate, duration: SCROLL_DURATION, easing: easeInOut, force: true });
    return;
  }
  window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
}
