/** Static site configuration that is not editorial content. */

export const SITE_NAME = "Dimas Jati Satria";
export const SITE_SHORT_NAME = "DJS";
export const DEFAULT_SITE_URL = "https://dimassj.vercel.app";

/** Public origin without a trailing slash. Falls back to the production domain. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    console.warn(
      `[site] NEXT_PUBLIC_SITE_URL is not a valid URL ("${raw}"); using ${DEFAULT_SITE_URL}.`,
    );
    return DEFAULT_SITE_URL;
  }
}

/** Primary navigation, in display order. Keys map to `nav.*` messages. */
export const NAV_ITEMS = [
  { key: "work", href: "/work" },
  { key: "about", href: "/about" },
  { key: "resume", href: "/resume" },
  { key: "lab", href: "/lab" },
  { key: "writing", href: "/writing" },
  { key: "contact", href: "/contact" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

/** Anchors of the five scroll acts on Home (PRD section 4). */
export const HOME_ACTS = [
  { id: "incidence", index: 1 },
  { id: "refraction", index: 2 },
  { id: "dispersion", index: 3 },
  { id: "shards", index: 4 },
  { id: "convergence", index: 5 },
] as const;

/**
 * Feature flags for work that lands in a later phase. Keeping the switch here
 * means the UI never shows a control that does nothing.
 */
export const FEATURES = {
  /** Sound design ships in F4; the toggle stays hidden until the audio engine exists. */
  sound: false,
} as const;

export const STORAGE_KEYS = {
  theme: "refraction:theme",
  sound: "refraction:sound",
  visited: "refraction:visited",
} as const;

export const TIME_ZONE = "Asia/Jakarta";
