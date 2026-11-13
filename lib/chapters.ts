/**
 * The Home story map (Spesifikasi Lanjutan 9.2) — the single source of truth for
 * chapter heights, progress ranges, rest poses and anchors. The DOM, the scene,
 * the story tracks and the tests all read from here.
 *
 * Progress is global, 0–1 over the whole story. Heights are in `svh`; the phone
 * heights are 60% of the desktop ones, so the same progress means the same frame
 * on every device.
 */

export const CHAPTER_IDS = ["apex", "ascent", "faces", "blocks", "recently", "base"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

/** A window of global progress. */
export interface ProgressWindow {
  start: number;
  end: number;
}

export interface Chapter extends ProgressWindow {
  id: ChapterId;
  /** Height in svh. */
  height: { desktop: number; mobile: number };
  /** Rest poses: the camera is still and the chapter's text is readable. */
  rests: readonly ProgressWindow[];
  /** Whether the chapter happens in the inverted world (Spesifikasi Lanjutan 11.3). */
  inverted: boolean;
  /** Position on the 5-dot chapter rail; Recently shares the Blocks dot. */
  rail: number;
}

/** Progress over which a beat fades in before its rest, and out after it. */
export const BEAT_FADE = 0.02;

/** Total story height in svh. */
export const STORY_HEIGHT = { desktop: 1500, mobile: 900 } as const;

const DEFINITIONS: ReadonlyArray<Omit<Chapter, "start" | "end">> = [
  {
    id: "apex",
    height: { desktop: 150, mobile: 90 },
    rests: [{ start: 0, end: 0.06 }],
    inverted: false,
    rail: 0,
  },
  {
    id: "ascent",
    height: { desktop: 250, mobile: 150 },
    rests: [{ start: 0.19, end: 0.24 }],
    inverted: true,
    rail: 1,
  },
  {
    id: "faces",
    height: { desktop: 300, mobile: 180 },
    rests: [
      { start: 0.31, end: 0.33 },
      { start: 0.35, end: 0.37 },
      { start: 0.39, end: 0.41 },
      { start: 0.43, end: 0.45 },
    ],
    inverted: true,
    rail: 2,
  },
  {
    id: "blocks",
    height: { desktop: 500, mobile: 300 },
    rests: [
      { start: 0.58, end: 0.62 },
      { start: 0.66, end: 0.7 },
      { start: 0.74, end: 0.78 },
    ],
    inverted: true,
    rail: 3,
  },
  {
    id: "recently",
    height: { desktop: 100, mobile: 60 },
    rests: [{ start: 0.82, end: 0.86 }],
    inverted: false,
    rail: 3,
  },
  {
    id: "base",
    height: { desktop: 200, mobile: 120 },
    rests: [{ start: 0.96, end: 1 }],
    inverted: false,
    rail: 4,
  },
];

export const CHAPTERS: readonly Chapter[] = (() => {
  let offset = 0;
  return DEFINITIONS.map((definition) => {
    const start = offset / STORY_HEIGHT.desktop;
    offset += definition.height.desktop;
    return { ...definition, start, end: offset / STORY_HEIGHT.desktop };
  });
})();

export function getChapter(id: ChapterId): Chapter {
  const chapter = CHAPTERS.find((candidate) => candidate.id === id);
  if (!chapter) throw new Error(`Unknown chapter: ${id}`);
  return chapter;
}

export function isChapterId(value: unknown): value is ChapterId {
  return typeof value === "string" && (CHAPTER_IDS as readonly string[]).includes(value);
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** The chapter that owns this progress. */
export function chapterAt(progress: number): Chapter {
  const p = clamp01(progress);
  return CHAPTERS.find((chapter) => p < chapter.end) ?? CHAPTERS[CHAPTERS.length - 1]!;
}

/** Where a deep link or the rail lands: the start of the chapter's first rest. */
export function restTarget(id: ChapterId): number {
  return getChapter(id).rests[0]!.start;
}

/** Every rest pose of the story, in order. */
export const ALL_RESTS: readonly ProgressWindow[] = CHAPTERS.flatMap((chapter) => chapter.rests);

/**
 * Tolerance for "inside a rest pose". Scroll positions are rounded to whole
 * pixels, so landing exactly on a rest can read as a hair before it
 * (0.002 of the story is ~3px on desktop).
 */
const REST_TOLERANCE = 0.002;

/** The chapter whose rest pose contains this progress, if any. */
export function restingChapter(progress: number): ChapterId | null {
  for (const chapter of CHAPTERS) {
    for (const rest of chapter.rests) {
      if (progress >= rest.start - REST_TOLERANCE && progress <= rest.end + REST_TOLERANCE) {
        return chapter.id;
      }
    }
  }
  return null;
}

/**
 * Visibility of a beat at this progress, 0–1. Mirrors the CSS in
 * `app/globals.css` (section 13), which is what actually renders it.
 */
export function beatVisibility(progress: number, beat: ProgressWindow): number {
  const fadeIn = clamp01((progress - beat.start + BEAT_FADE) / BEAT_FADE);
  const fadeOut = clamp01((beat.end + BEAT_FADE - progress) / BEAT_FADE);
  return Math.min(fadeIn, fadeOut);
}

/**
 * The next rest pose in a direction, for PageDown / PageUp. A rest counts as
 * "reached" when progress is inside it or just short of it.
 */
export function adjacentRest(progress: number, direction: 1 | -1): ProgressWindow | null {
  const epsilon = 0.001;
  if (direction === 1) {
    return ALL_RESTS.find((rest) => rest.start > progress + epsilon) ?? null;
  }
  for (let index = ALL_RESTS.length - 1; index >= 0; index--) {
    const rest = ALL_RESTS[index]!;
    if (rest.start < progress - epsilon) return rest;
  }
  return null;
}
