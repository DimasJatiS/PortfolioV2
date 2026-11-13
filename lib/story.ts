/**
 * Story tracks (Spesifikasi Lanjutan 10.3): every value the scene animates
 * during the Home story, as a pure function of global progress.
 *
 * Pure functions instead of a tweening timeline: the frame at progress `p` is
 * identical whether it was reached from above or from below, the tracks can be
 * unit-tested without WebGL, and no animation library ships for this.
 */

import { getChapter } from "./chapters";

export interface StoryState {
  /** 1 while the blocks breathe (Apex), then 0. */
  breath: number;
  /** 1 while the transmission pyramid is shown; 0 once the camera is inside. */
  glass: number;
  /** Background inversion, 0 = the visitor's theme, 1 = the opposite one. */
  invert: number;
  /** The apex block lifting away so the camera can rise through it. */
  capLift: number;
  /** Rotation of the pyramid about its axis, in radians. */
  yaw: number;
  /** Glass → wireframe, 0–1. */
  dissolve: number;
  /** Which face is lit during Faces (0–3), and how strongly. */
  face: number;
  faceGlow: number;
  /** Pyramid flying apart into blocks, 0–1. */
  explode: number;
  /** Blocks settling back, base first, 0–1. */
  assemble: number;
  /** Per featured block: 0 → 1 during its push-in, 1 at rest, back to 0. */
  focus: [number, number, number];
  /** The thread of light from apex to base, 0–1 drawn. */
  guide: number;
  /** Hairline rays and apex flare visibility. */
  rays: number;
  flare: number;
  /** Orange core light seen through the seams. */
  core: number;
  /** Halo ring at the base. */
  halo: number;
  /** Brand dispersion sweep at chapter thresholds. */
  dispersion: number;
}

export function createStoryState(): StoryState {
  return {
    breath: 1,
    glass: 1,
    invert: 0,
    capLift: 0,
    yaw: HERO_YAW,
    dissolve: 0,
    face: 0,
    faceGlow: 0,
    explode: 0,
    assemble: 0,
    focus: [0, 0, 0],
    guide: 0,
    rays: 1,
    flare: 1,
    core: 1,
    halo: 0,
    dispersion: 0,
  };
}

/** Smoothstep from 0 at `from` to 1 at `to`. */
export function ramp(progress: number, from: number, to: number): number {
  if (progress <= from) return 0;
  if (progress >= to) return 1;
  const t = (progress - from) / (to - from);
  return t * t * (3 - 2 * t);
}

/** A smooth bump centred on `centre`, `width` wide in total. */
export function bell(progress: number, centre: number, width: number): number {
  const distance = Math.abs(progress - centre) / (width / 2);
  if (distance >= 1) return 0;
  const t = 1 - distance;
  return t * t * (3 - 2 * t);
}

/** Yaw of the hero pose: a quarter-ish turn shows an edge, two faces, like the key visual. */
export const HERO_YAW = Math.PI / 5;

/**
 * Yaw during Faces: face `k` points at the bottom of the screen in the top-down
 * view. Face 0's outward normal sits at 45° in the pyramid's own frame.
 */
const faceYaw = (k: number) => -Math.PI / 4 - (k * Math.PI) / 2;

/** Pierce point: the camera crosses the glass; the glass pyramid hands over to the block shell. */
export const PIERCE = 0.162;

/** Thresholds where the brand dispersion sweeps the frame. */
export const DISPERSION_PEAKS = [PIERCE, 0.267, 0.47, 0.807] as const;

const faces = getChapter("faces");
const blocks = getChapter("blocks");
const base = getChapter("base");

/** Evaluate every track at `progress` into `out` (allocation-free, called every frame). */
export function evaluateStory(progress: number, out: StoryState): StoryState {
  const p = Math.min(1, Math.max(0, progress));

  out.breath = 1 - ramp(p, 0.1, 0.12);
  out.glass = p < PIERCE ? 1 : 0;
  out.invert = ramp(p, 0.155, 0.17) * (1 - ramp(p, 0.8, 0.815));
  out.capLift = ramp(p, 0.215, 0.25) * (1 - ramp(p, 0.87, 0.93));

  // Yaw: hero pose → face 0 during the crane → one quarter turn per face →
  // back to the hero pose (one full turn later) before the blocks fly apart.
  const [r0, r1, r2, r3] = faces.rests;
  let yaw = HERO_YAW + ramp(p, 0.267, r0!.start) * (faceYaw(0) - HERO_YAW);
  yaw += ramp(p, r0!.end, r1!.start) * (faceYaw(1) - faceYaw(0));
  yaw += ramp(p, r1!.end, r2!.start) * (faceYaw(2) - faceYaw(1));
  yaw += ramp(p, r2!.end, r3!.start) * (faceYaw(3) - faceYaw(2));
  yaw += ramp(p, r3!.end, 0.47) * (HERO_YAW - 2 * Math.PI - faceYaw(3));
  out.yaw = yaw;

  out.dissolve = ramp(p, 0.285, r0!.start) * (1 - ramp(p, r3!.end, 0.47));

  out.face = 0;
  out.faceGlow = 0;
  faces.rests.forEach((rest, index) => {
    const glow = ramp(p, rest.start - 0.012, rest.start) * (1 - ramp(p, rest.end, rest.end + 0.012));
    if (glow > out.faceGlow) {
      out.face = index;
      out.faceGlow = glow;
    }
  });

  out.explode = ramp(p, 0.5, 0.54);
  out.assemble = ramp(p, base.start, 0.94);

  blocks.rests.forEach((rest, index) => {
    out.focus[index] =
      ramp(p, rest.start - 0.04, rest.start) * (1 - ramp(p, rest.end, rest.end + 0.03));
  });

  out.guide = ramp(p, 0.02, 0.97);
  out.rays = (1 - ramp(p, 0.1, 0.14)) + ramp(p, 0.9, 0.95);
  // The flare is a billboard at the apex. It fades before the camera rises
  // through the apex, or it would fill the screen.
  out.flare =
    1 - ramp(p, 0.14, 0.17) + ramp(p, 0.17, 0.19) * (1 - ramp(p, 0.232, 0.248)) + ramp(p, 0.94, 0.97);
  out.core = (1 - ramp(p, 0.13, 0.155)) + ramp(p, 0.9, 0.96);
  out.halo = ramp(p, 0.93, 0.97);

  let dispersion = 0;
  for (const peak of DISPERSION_PEAKS) dispersion = Math.max(dispersion, bell(p, peak, 0.012));
  out.dispersion = dispersion;

  return out;
}
