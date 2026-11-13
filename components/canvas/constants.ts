/** Shared geometry of the hero pyramid, in world units. */
export const PYRAMID = {
  radius: 1.3,
  height: 2.2,
  /** ConeGeometry with four radial segments is a square pyramid. */
  sides: 4,
} as const;

export const APEX_Y = PYRAMID.height / 2;
export const BASE_Y = -PYRAMID.height / 2;

export const CAMERA = {
  fov: 35,
  position: [0, 0.2, 6] as [number, number, number],
  /** Cursor parallax, about ±3° of orbit at this distance (PRD 7.2). */
  parallax: { x: 0.31, y: 0.2 },
} as const;

/**
 * - `story`   Home with motion: the camera flies the story path (Spesifikasi Lanjutan 9–11)
 * - `hero`    Home with reduced motion: one still hero frame
 * - `ambient` editorial pages: a small pyramid beside the page header
 */
export type SceneMode = "story" | "hero" | "ambient";
