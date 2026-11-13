/**
 * Camera path of the Home story (Spesifikasi Lanjutan 10.2).
 *
 * World units match `components/canvas/constants.ts`: the pyramid sits at the
 * origin at scale 1 (radius 1.3, height 2.2, apex y = 1.1, base y = −1.1).
 *
 * Interpolation is a cubic Hermite spline parameterised by progress. Tangents
 * are finite differences (Catmull-Rom style), except next to a rest pose, where
 * they are zero: two identical keyframes then hold the camera perfectly still.
 * (three's CatmullRomCurve3 keeps moving between identical points, which is why
 * it is not used here.) Plain tuples keep this module free of three.js, so it is
 * cheap to unit-test and never pulled into the DOM bundle.
 */

export type Vec3 = readonly [number, number, number];

export interface CameraKeyframe {
  p: number;
  position: Vec3;
  target: Vec3;
  /** Vertical field of view in degrees, before the portrait fit. */
  fov: number;
  /** Up hint; never parallel to the view direction. */
  up: Vec3;
}

export interface CameraSample {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov: number;
}

/** Where the three featured blocks float once the pyramid has flown apart (world space). */
export const FEATURED_BLOCKS: readonly Vec3[] = [
  [-1.6, 0.4, 1.4],
  [1.5, -0.1, 1.8],
  [-0.2, -0.8, 2.4],
];

/** Camera offset from a featured block during its push-in: close, with air around the block. */
const PUSH_OFFSET: Vec3 = [0.35, 0.2, 2.6];

const UP_Y: Vec3 = [0, 1, 0];
const UP_Z: Vec3 = [0, 0, 1];
const UP_NEG_Z: Vec3 = [0, 0, -1];

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const hold = (frame: CameraKeyframe, p: number): CameraKeyframe => ({ ...frame, p });

// The classic hero framing (the pyramid between the eyebrow and the statement):
// the old hero rig's scale 0.72 at y = +0.41, expressed at scale 1.
const K0: CameraKeyframe = { p: 0, position: [0, -0.29, 8.33], target: [0, -0.57, 0], fov: 35, up: UP_Y };
const K5: CameraKeyframe = { p: 0.19, position: [0, -0.6, 0.05], target: [0, 1.1, 0], fov: 58, up: UP_Z };
const K8: CameraKeyframe = { p: 0.3, position: [0, 7.5, 0.01], target: [0, 0, 0], fov: 35, up: UP_NEG_Z };
const K10: CameraKeyframe = { p: 0.5, position: [5.2, 3, 5.2], target: [0, -0.1, 0], fov: 35, up: UP_Y };
const K12: CameraKeyframe = { p: 0.8, position: [3, 1.2, 7], target: [0, 0, 0], fov: 35, up: UP_Y };
const K14: CameraKeyframe = { p: 0.96, position: [0, 1.4, 14], target: [0, -0.6, 0], fov: 28, up: UP_Y };

const featuredFrames = FEATURED_BLOCKS.flatMap((block, index): CameraKeyframe[] => {
  const arrive: CameraKeyframe = {
    p: 0.58 + index * 0.08,
    position: add(block, PUSH_OFFSET),
    target: block,
    fov: 30,
    up: UP_Y,
  };
  return [arrive, hold(arrive, 0.62 + index * 0.08)];
});

export const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  K0,
  hold(K0, 0.06),
  { p: 0.12, position: [1.2, 0.2, 4], target: [0, 0, 0], fov: 38, up: UP_Y },
  { p: 0.155, position: [0.35, -0.2, 1.1], target: [0, -0.2, 0], fov: 46, up: UP_Y },
  // Inside: looking ahead, then up at the apex.
  { p: 0.17, position: [0, -0.35, 0.15], target: [0, -0.2, -1], fov: 58, up: UP_Y },
  K5,
  hold(K5, 0.24),
  // Out through the apex (the cap block has lifted aside), then a pure pitch
  // from looking up, through the horizon, to looking straight down.
  { p: 0.267, position: [0, 1.6, 0], target: [0, 4, 0], fov: 50, up: UP_Z },
  { p: 0.285, position: [0, 4, 0.6], target: [0, 4, -3], fov: 42, up: UP_Y },
  K8,
  hold(K8, 0.45),
  // Crane down on the +z side, then orbit to the 3/4 view.
  { p: 0.475, position: [0, 3.5, 6], target: [0, -0.1, 0], fov: 35, up: [0, 0.86, -0.51] },
  K10,
  hold(K10, 0.54),
  ...featuredFrames,
  K12,
  hold(K12, 0.86),
  K14,
  hold(K14, 1),
];

const same = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

function isRestNeighbour(index: number): boolean {
  const frame = CAMERA_KEYFRAMES[index]!;
  const previous = CAMERA_KEYFRAMES[index - 1];
  const next = CAMERA_KEYFRAMES[index + 1];
  const equal = (other: CameraKeyframe | undefined) =>
    other !== undefined && same(other.position, frame.position) && same(other.target, frame.target);
  return equal(previous) || equal(next) || previous === undefined || next === undefined;
}

type Channel = "position" | "target";

/** Tangents per keyframe and channel, in world units per unit of progress. */
const TANGENTS: Record<Channel, Vec3[]> = (() => {
  const compute = (channel: Channel) =>
    CAMERA_KEYFRAMES.map((frame, index): Vec3 => {
      if (isRestNeighbour(index)) return [0, 0, 0];
      const previous = CAMERA_KEYFRAMES[index - 1]!;
      const next = CAMERA_KEYFRAMES[index + 1]!;
      const span = next.p - previous.p;
      return [
        (next[channel][0] - previous[channel][0]) / span,
        (next[channel][1] - previous[channel][1]) / span,
        (next[channel][2] - previous[channel][2]) / span,
      ];
    });
  return { position: compute("position"), target: compute("target") };
})();

const smooth = (t: number) => t * t * (3 - 2 * t);

export function createCameraSample(): CameraSample {
  return { position: [0, 0, 0], target: [0, 0, 0], up: [0, 1, 0], fov: 35 };
}

/** Sample the path at `progress` into `out` (allocation-free; called every frame). */
export function sampleCamera(progress: number, out: CameraSample): CameraSample {
  const p = Math.min(1, Math.max(0, progress));
  const frames = CAMERA_KEYFRAMES;

  let index = frames.length - 2;
  for (let candidate = 0; candidate < frames.length - 1; candidate++) {
    if (p < frames[candidate + 1]!.p) {
      index = candidate;
      break;
    }
  }

  const a = frames[index]!;
  const b = frames[index + 1]!;

  // Rest pose: copy the keyframe exactly, so the camera is bit-for-bit still.
  if (same(a.position, b.position) && same(a.target, b.target) && a.fov === b.fov) {
    for (let axis = 0; axis < 3; axis++) {
      out.position[axis] = a.position[axis]!;
      out.target[axis] = a.target[axis]!;
      out.up[axis] = a.up[axis]!;
    }
    out.fov = a.fov;
    return out;
  }

  const h = b.p - a.p;
  const s = h > 0 ? Math.min(1, Math.max(0, (p - a.p) / h)) : 1;

  // Cubic Hermite basis.
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;

  for (const channel of ["position", "target"] as const) {
    const ta = TANGENTS[channel][index]!;
    const tb = TANGENTS[channel][index + 1]!;
    for (let axis = 0; axis < 3; axis++) {
      out[channel][axis] =
        h00 * a[channel][axis]! +
        h10 * h * ta[axis]! +
        h01 * b[channel][axis]! +
        h11 * h * tb[axis]!;
    }
  }

  const e = smooth(s);
  out.fov = a.fov + (b.fov - a.fov) * e;

  // Up: normalised lerp. Keyframes are chosen so neighbours are < 90° apart.
  let length = 0;
  for (let axis = 0; axis < 3; axis++) {
    const value = a.up[axis]! + (b.up[axis]! - a.up[axis]!) * e;
    out.up[axis] = value;
    length += value * value;
  }
  length = Math.sqrt(length) || 1;
  out.up[0] /= length;
  out.up[1] /= length;
  out.up[2] /= length;

  return out;
}

/**
 * Portrait screens see a narrow slice horizontally. Widen the vertical FOV so
 * the pyramid keeps fitting, without moving the camera (moving it would push it
 * out through the glass during Ascent).
 */
export function fitFov(fov: number, aspect: number): number {
  if (aspect >= 1) return fov;
  const factor = Math.min(1.5, 1 / Math.sqrt(aspect));
  const half = (fov * Math.PI) / 360;
  return (Math.atan(Math.tan(half) * factor) * 360) / Math.PI;
}
