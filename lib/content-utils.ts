import { BEAMS, type Beam } from "@/sanity/constants";
import type { SiteSettings, Skill } from "@/sanity/types";

/** Pure helpers for shaping content. No I/O, safe to unit test and to use anywhere. */

export function groupSkillsByBeam(skills: readonly Skill[]): Record<Beam, Skill[]> {
  const groups = Object.fromEntries(BEAMS.map((beam) => [beam, [] as Skill[]])) as Record<
    Beam,
    Skill[]
  >;
  for (const skill of skills) {
    if (skill.beam) groups[skill.beam].push(skill);
  }
  for (const beam of BEAMS) {
    groups[beam].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }
  return groups;
}

const WORDS_PER_MINUTE = 200;

/** Estimated reading time in whole minutes, never less than one. */
export function readingMinutes(text: string | undefined): number {
  const words = text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

const CV_FILE_NAME = "Dimas-Jati-Satria-CV.pdf";

export interface CvLink {
  href: string;
  /** `true` for a same-origin file, where the `download` attribute is honoured. */
  local: boolean;
}

/**
 * Where the CV button points: the PDF uploaded in Sanity, else `public/cv.pdf`
 * when one was present at build time, else `null` (callers link to /resume).
 *
 * Browsers ignore `download` on cross-origin links, so for the Sanity CDN the
 * `dl` query parameter is used to make the file download with a proper name.
 */
export function getCvLink(settings: Pick<SiteSettings, "cvUrl">): CvLink | null {
  if (settings.cvUrl) {
    try {
      const url = new URL(settings.cvUrl);
      if (url.hostname === "cdn.sanity.io") url.searchParams.set("dl", CV_FILE_NAME);
      return { href: url.toString(), local: false };
    } catch {
      // Fall through to the local file.
    }
  }
  return process.env.NEXT_PUBLIC_HAS_LOCAL_CV === "1"
    ? { href: "/cv.pdf", local: true }
    : null;
}

export interface AccentSegment {
  text: string;
  accent: boolean;
}

/**
 * Split a statement on `*asterisk*` markers. The marked words are set in the
 * italic serif accent, which lets the hero line stay editable as plain text.
 */
export function splitAccent(text: string): AccentSegment[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith("*") && part.endsWith("*") && part.length > 2
        ? { text: part.slice(1, -1), accent: true }
        : { text: part, accent: false },
    );
}

/** Label for a social link, e.g. `mailto:a@b.c` → `a@b.c`, URL → host + path. */
export function formatLinkLabel(url: string): string {
  if (url.startsWith("mailto:")) return url.slice("mailto:".length).split("?")[0] ?? url;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return url;
  }
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
