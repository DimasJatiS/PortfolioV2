/**
 * Motion tokens (Spesifikasi Lanjutan, section 1) — TypeScript mirror of the
 * `--ease-*`, `--dur-*` and `--stagger-*` CSS variables in `app/globals.css`.
 * Use these from JS-driven animation (GSAP, R3F); use the CSS variables in styles.
 */

export const ease = {
  /** expo-out: nearly every reveal and transition. */
  light: [0.22, 1, 0.36, 1],
  /** camera moves and large scale changes. */
  inout: [0.65, 0, 0.35, 1],
} as const;

export const easeCss = {
  light: `cubic-bezier(${ease.light.join(", ")})`,
  inout: `cubic-bezier(${ease.inout.join(", ")})`,
} as const;

/** Durations in milliseconds. */
export const duration = {
  xs: 150,
  s: 300,
  m: 600,
  l: 900,
  xl: 1400,
} as const;

/** Stagger offsets in milliseconds. */
export const stagger = {
  char: 20,
  line: 80,
} as const;

/** UI spring: fast response, no visible overshoot. */
export const springUi = { stiffness: 300, damping: 30 } as const;

/**
 * Lambda range for `maath/easing.damp`. Frame-rate independent, so motion feels
 * the same at 60 Hz and 120 Hz.
 */
export const damp3d = { min: 4, max: 6, default: 5 } as const;

/** Loader → hero choreography offsets in milliseconds (Spesifikasi Lanjutan, section 2). */
export const loaderTimeline = {
  minVisible: 1200,
  revisitVisible: 600,
  slowHint: 6000,
  settle: 0,
  grow: 400,
  fillGlass: 700,
  flare: 1000,
  heroText: 1200,
  scrollEnabled: 1800,
} as const;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
