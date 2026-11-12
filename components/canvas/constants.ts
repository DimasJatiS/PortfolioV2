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

/** Where the scene sits for the immersive Home and for the editorial pages. */
export type SceneMode = "hero" | "ambient";
