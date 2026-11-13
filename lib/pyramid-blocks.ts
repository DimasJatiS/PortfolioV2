/**
 * The pyramid as a hollow shell of blocks (Spesifikasi Lanjutan 11.1).
 *
 * Hollow, like an igloo, so the camera can fly inside during Ascent and see the
 * walls rising to the apex. Each face is cut into 4 horizontal bands, each band
 * into a few slabs, plus one solid cap block at the apex: 49 blocks.
 *
 * Output is plain typed arrays (no three.js), merged into one geometry with
 * per-vertex block attributes. The vertex shader breathes, explodes and
 * reassembles the blocks from uniforms, so the CPU does no per-frame work and
 * the whole shell is a single draw call (plus one for its edges).
 *
 * Orientation matches the procedural glass pyramid (`ConeGeometry`, 4 radial
 * segments): base corners on the ±x / ±z axes.
 */

import { FEATURED_BLOCKS, type Vec3 } from "./camera-path";
import { HERO_YAW } from "./story";

export const SHELL = {
  radius: 1.3,
  height: 2.2,
  /** Slabs per face, bottom band first. */
  bands: [4, 3, 3, 2] as const,
  /** Wall thickness, measured horizontally. */
  thickness: 0.14,
  /** Each block shrinks toward its centre so the seams show. */
  shrink: 0.955,
} as const;

const APEX = SHELL.height / 2;
const BASE = -SHELL.height / 2;
/** Half-side of the base square in the block's own (axis-aligned) frame. */
const HALF_SIDE = SHELL.radius / Math.SQRT2;
const BAND_HEIGHT = SHELL.height / (SHELL.bands.length + 1);

/** Featured blocks: [band, face, slab]. Front-facing slabs from the lower bands. */
export const FEATURED_PIECES: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 1],
  [2, 1, 1],
  [1, 3, 1],
];

/** Where the apex cap moves (pyramid-local) so the camera can rise through the opening. */
export const CAP_LIFT: Vec3 = [0.9, 0.9, -0.3];

export interface BlockPiece {
  center: Vec3;
  layer: number;
  face: number;
  featured: number;
}

export interface BlockShell {
  pieces: BlockPiece[];
  /** Triangles: position, normal, and per-vertex block attributes. */
  mesh: VertexData;
  /** Line segments along every block edge, same block attributes. */
  edges: VertexData;
}

export interface VertexData {
  position: Float32Array;
  normal: Float32Array;
  center: Float32Array;
  offset: Float32Array;
  spin: Float32Array;
  layer: Float32Array;
  seed: Float32Array;
  face: Float32Array;
  featured: Float32Array;
  count: number;
}

type V = [number, number, number];

const halfSideAt = (y: number) => (HALF_SIDE * (APEX - y)) / SHELL.height;

function rotateY(point: Readonly<V>, angle: number): V {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [point[0] * cos + point[2] * sin, point[1], -point[0] * sin + point[2] * cos];
}

const sub = (a: Readonly<V>, b: Readonly<V>): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Readonly<V>, b: Readonly<V>): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Readonly<V>, b: Readonly<V>) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (a: Readonly<V>): V => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};
const average = (points: ReadonlyArray<Readonly<V>>): V => {
  const sum: V = [0, 0, 0];
  for (const point of points) {
    sum[0] += point[0];
    sum[1] += point[1];
    sum[2] += point[2];
  }
  return [sum[0] / points.length, sum[1] / points.length, sum[2] / points.length];
};

/** Deterministic PRNG, so the explode pattern is the same on every visit. */
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PieceAttributes {
  center: V;
  offset: V;
  spin: V;
  layer: number;
  seed: number;
  face: number;
  featured: number;
}

class Builder {
  private readonly data: Record<keyof Omit<VertexData, "count">, number[]> = {
    position: [],
    normal: [],
    center: [],
    offset: [],
    spin: [],
    layer: [],
    seed: [],
    face: [],
    featured: [],
  };

  push(position: Readonly<V>, normal: Readonly<V>, piece: PieceAttributes) {
    const d = this.data;
    d.position.push(...position);
    d.normal.push(...normal);
    d.center.push(...piece.center);
    d.offset.push(...piece.offset);
    d.spin.push(...piece.spin);
    d.layer.push(piece.layer);
    d.seed.push(piece.seed);
    d.face.push(piece.face);
    d.featured.push(piece.featured);
  }

  build(): VertexData {
    const d = this.data;
    return {
      position: new Float32Array(d.position),
      normal: new Float32Array(d.normal),
      center: new Float32Array(d.center),
      offset: new Float32Array(d.offset),
      spin: new Float32Array(d.spin),
      layer: new Float32Array(d.layer),
      seed: new Float32Array(d.seed),
      face: new Float32Array(d.face),
      featured: new Float32Array(d.featured),
      count: d.layer.length,
    };
  }
}

/** Emit a convex polygon as a triangle fan with a flat normal pointing away from the block centre. */
function emitPolygon(
  mesh: Builder,
  corners: ReadonlyArray<Readonly<V>>,
  piece: PieceAttributes,
) {
  const first = corners[0]!;
  let normal = normalize(cross(sub(corners[1]!, first), sub(corners[2]!, first)));
  let ordered = corners;
  if (dot(normal, sub(average(corners), piece.center)) < 0) {
    normal = [-normal[0], -normal[1], -normal[2]];
    ordered = [...corners].reverse();
  }
  for (let index = 1; index < ordered.length - 1; index++) {
    mesh.push(ordered[0]!, normal, piece);
    mesh.push(ordered[index]!, normal, piece);
    mesh.push(ordered[index + 1]!, normal, piece);
  }
}

function emitEdges(
  edges: Builder,
  corners: ReadonlyArray<Readonly<V>>,
  pairs: ReadonlyArray<readonly [number, number]>,
  piece: PieceAttributes,
) {
  for (const [a, b] of pairs) {
    const from = corners[a]!;
    const to = corners[b]!;
    const direction = normalize(sub(to, from));
    edges.push(from, direction, piece);
    edges.push(to, direction, piece);
  }
}

const HEX_FACES = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7],
] as const;
const HEX_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
] as const;
const CAP_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [0, 4], [1, 4], [2, 4], [3, 4],
] as const;

export function buildBlockShell(): BlockShell {
  const random = mulberry32(0x5_2026);
  const mesh = new Builder();
  const edges = new Builder();
  const pieces: BlockPiece[] = [];

  /** World position → pyramid-local, at the yaw the pyramid has during Blocks. */
  const toLocal = (world: Vec3): V => rotateY(world, -HERO_YAW);

  const makePiece = (corners: V[], layer: number, face: number, featured: number) => {
    const center = average(corners);
    const shrunk = corners.map(
      (corner): V => [
        center[0] + (corner[0] - center[0]) * SHELL.shrink,
        center[1] + (corner[1] - center[1]) * SHELL.shrink,
        center[2] + (corner[2] - center[2]) * SHELL.shrink,
      ],
    );

    const seed = random();
    let offset: V;
    let spin: V;
    if (featured > 0) {
      // Fly to the composed position the camera pushes into, and turn the outer
      // face toward the camera (+z world), leaving a quarter-ish turn and a
      // slight tilt so it still reads as a solid block, not a flat panel.
      offset = sub(toLocal(FEATURED_BLOCKS[featured - 1]!), center);
      const faceAngle = (face * Math.PI) / 2 + Math.PI / 4;
      spin = [0.2, -(faceAngle + HERO_YAW) + 0.45, 0];
    } else {
      const outward = normalize([center[0], center[1] * 0.35 + 0.1, center[2]]);
      const distance = 0.8 + seed * 1.6;
      offset = [
        outward[0] * distance + (random() - 0.5) * 0.4,
        outward[1] * distance + (random() - 0.5) * 0.6,
        outward[2] * distance + (random() - 0.5) * 0.4,
      ];
      const axis = normalize([random() - 0.5, random() - 0.5, random() - 0.5]);
      const angle = 0.6 + random() * 1.2;
      spin = [axis[0] * angle, axis[1] * angle, axis[2] * angle];
    }

    const piece: PieceAttributes = { center, offset, spin, layer, seed, face, featured };
    pieces.push({ center, layer, face, featured });
    return { piece, corners: shrunk };
  };

  // Shell slabs.
  SHELL.bands.forEach((slabs, band) => {
    const y0 = BASE + band * BAND_HEIGHT;
    const y1 = y0 + BAND_HEIGHT;
    for (let face = 0; face < 4; face++) {
      const angle = (face * Math.PI) / 2 + Math.PI / 4;
      for (let slab = 0; slab < slabs; slab++) {
        const u0 = -1 + (2 * slab) / slabs;
        const u1 = -1 + (2 * (slab + 1)) / slabs;
        const outer = (y: number, u: number): V => [u * halfSideAt(y), y, halfSideAt(y)];
        // Horizontal inset: band seams and the base stay flat, and the inner
        // corners of neighbouring faces meet on the diagonal (a mitre).
        const inner = (y: number, u: number): V => {
          const innerHalf = halfSideAt(y) - SHELL.thickness;
          return [u * innerHalf, y, innerHalf];
        };
        const local: V[] = [
          outer(y0, u0),
          outer(y0, u1),
          inner(y0, u1),
          inner(y0, u0),
          outer(y1, u0),
          outer(y1, u1),
          inner(y1, u1),
          inner(y1, u0),
        ];
        const corners = local.map((corner) => rotateY(corner, angle));
        const featured =
          FEATURED_PIECES.findIndex(([b, f, s]) => b === band && f === face && s === slab) + 1;
        const { piece, corners: shrunk } = makePiece(corners, band, face, featured);
        for (const quad of HEX_FACES) {
          emitPolygon(mesh, quad.map((index) => shrunk[index]!), piece);
        }
        emitEdges(edges, shrunk, HEX_EDGES, piece);
      }
    }
  });

  // Solid cap at the apex.
  const capBase = APEX - BAND_HEIGHT;
  const half = halfSideAt(capBase);
  const capCorners: V[] = [
    [-half, capBase, -half],
    [half, capBase, -half],
    [half, capBase, half],
    [-half, capBase, half],
    [0, APEX, 0],
  ].map((corner) => rotateY(corner as V, Math.PI / 4));
  const { piece: cap, corners: capShrunk } = makePiece(capCorners, SHELL.bands.length, 4, 0);
  emitPolygon(mesh, capShrunk.slice(0, 4), cap);
  for (let side = 0; side < 4; side++) {
    emitPolygon(mesh, [capShrunk[side]!, capShrunk[(side + 1) % 4]!, capShrunk[4]!], cap);
  }
  emitEdges(edges, capShrunk, CAP_EDGES, cap);

  return { pieces, mesh: mesh.build(), edges: edges.build() };
}
