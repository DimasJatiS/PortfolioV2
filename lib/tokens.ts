/**
 * Design tokens — the TypeScript mirror of the CSS variables in `app/globals.css`.
 *
 * CSS is what the DOM consumes; this file exists so that the WebGL scene, the
 * style tile and the contrast tests can read the same values. `tests/tokens.test.ts`
 * fails if the two ever drift apart.
 */

export const palette = {
  "ivory-50": "#FBF8F1",
  "ivory-100": "#F3EDE0",
  "ink-900": "#14201A",
  "ink-600": "#4B5A52",
  "green-950": "#06261B",
  "green-900": "#0B3D2C",
  "green-700": "#1F5A43",
  "sage-300": "#A9BFA8",
  "amber-400": "#E3A63B",
  "orange-400": "#F28B55",
  "orange-500": "#E8692A",
  "orange-700": "#B8501C",
  "orange-800": "#A84616",
} as const;

export type PaletteToken = keyof typeof palette;

/**
 * Tokens that are not in the PRD palette table. They were derived during the F0
 * contrast audit and are documented on the style tile:
 * - `ink-600`     muted body text (6.87:1 on ivory-50).
 * - `orange-800`  small accent text on ivory-100, where orange-700 only reaches 4.28:1.
 * - `orange-400`  small accent text in Night, where orange-500 only reaches 3.77:1 on green-900.
 * - `amber-400`   the fourth stop of the brand ramp (PRD section 4), decoration only.
 */
export const derivedTokens: readonly PaletteToken[] = [
  "ink-600",
  "orange-800",
  "orange-400",
  "amber-400",
];

export const themes = ["day", "night"] as const;
export type Theme = (typeof themes)[number];

/** A surface is a background plus the foreground roles that are legal on it. */
export interface SurfaceTokens {
  bg: PaletteToken;
  fg: PaletteToken;
  fgMuted: PaletteToken;
  heading: PaletteToken;
  /** Accent for text below 24px. */
  accentText: PaletteToken;
  /** Accent for large text (>= 24px) and non-text marks. */
  accent: PaletteToken;
  /** Hairlines and secondary icons. Decorative, exempt from text contrast. */
  line: PaletteToken;
}

export type SurfaceName = "base" | "alt" | "inverse";

export const surfaces: Record<Theme, Record<SurfaceName, SurfaceTokens>> = {
  day: {
    base: {
      bg: "ivory-50",
      fg: "ink-900",
      fgMuted: "ink-600",
      heading: "green-900",
      accentText: "orange-700",
      accent: "orange-500",
      line: "sage-300",
    },
    alt: {
      bg: "ivory-100",
      fg: "ink-900",
      fgMuted: "ink-600",
      heading: "green-900",
      accentText: "orange-800",
      accent: "orange-500",
      line: "sage-300",
    },
    inverse: {
      bg: "green-900",
      fg: "ivory-50",
      fgMuted: "sage-300",
      heading: "ivory-50",
      accentText: "orange-400",
      accent: "orange-500",
      line: "green-700",
    },
  },
  night: {
    base: {
      bg: "green-950",
      fg: "ivory-50",
      fgMuted: "sage-300",
      heading: "ivory-50",
      accentText: "orange-400",
      accent: "orange-500",
      line: "green-700",
    },
    alt: {
      bg: "green-900",
      fg: "ivory-50",
      fgMuted: "sage-300",
      heading: "ivory-50",
      accentText: "orange-400",
      accent: "orange-500",
      line: "green-700",
    },
    inverse: {
      bg: "ivory-50",
      fg: "ink-900",
      fgMuted: "ink-600",
      heading: "green-900",
      accentText: "orange-700",
      accent: "orange-500",
      line: "sage-300",
    },
  },
};

/** Primary button: dark ink on orange (5.18:1). Ivory on orange is only 3.05:1. */
export const primaryButton = { bg: "orange-500", fg: "ink-900" } as const satisfies {
  bg: PaletteToken;
  fg: PaletteToken;
};

/** Brand ramp: the colour stops of the light running down the faces, instead of a rainbow (PRD section 4). */
export const lightRamp: readonly PaletteToken[] = [
  "ivory-50",
  "sage-300",
  "green-700",
  "amber-400",
  "orange-500",
];

/** Colours the WebGL scene needs per theme. */
export const sceneColors: Record<
  Theme,
  { bgTop: string; bgBottom: string; ray: string; glassTint: string; flareCore: string }
> = {
  day: {
    bgTop: palette["ivory-50"],
    bgBottom: palette["ivory-100"],
    ray: palette["green-700"],
    // A very light sage: on ivory the glass is defined by its edges, rays and
    // highlights, not by a heavy tint.
    glassTint: "#E4EBDF",
    flareCore: palette["ivory-50"],
  },
  night: {
    bgTop: palette["green-950"],
    bgBottom: "#04170F",
    ray: palette["sage-300"],
    glassTint: palette["green-700"],
    flareCore: palette["ivory-50"],
  },
};

export const layout = {
  maxWidth: 1440,
  gutter: 24,
  unit: 8,
  columns: { mobile: 4, tablet: 6, desktop: 12 },
} as const;
