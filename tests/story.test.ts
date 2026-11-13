import { describe, expect, it } from "vitest";
import { CAMERA_KEYFRAMES, createCameraSample, FEATURED_BLOCKS, fitFov, sampleCamera } from "@/lib/camera-path";
import {
  adjacentRest,
  ALL_RESTS,
  BEAT_FADE,
  beatVisibility,
  CHAPTERS,
  chapterAt,
  restingChapter,
  restTarget,
  STORY_HEIGHT,
} from "@/lib/chapters";
import { buildBlockShell, CAP_LIFT, SHELL } from "@/lib/pyramid-blocks";
import { createStoryState, evaluateStory, HERO_YAW, PIERCE } from "@/lib/story";

/** Progress samples at 1/2000 resolution, ~0.75svh apart on desktop. */
const SAMPLES = Array.from({ length: 2001 }, (_, index) => index / 2000);

describe("chapter map", () => {
  it("adds up to the story height on desktop and phone", () => {
    const desktop = CHAPTERS.reduce((sum, chapter) => sum + chapter.height.desktop, 0);
    const mobile = CHAPTERS.reduce((sum, chapter) => sum + chapter.height.mobile, 0);
    expect(desktop).toBe(STORY_HEIGHT.desktop);
    expect(mobile).toBe(STORY_HEIGHT.mobile);
  });

  it("keeps the phone heights proportional, so progress means the same frame", () => {
    for (const chapter of CHAPTERS) {
      expect(chapter.height.mobile / STORY_HEIGHT.mobile).toBeCloseTo(
        chapter.height.desktop / STORY_HEIGHT.desktop,
        10,
      );
    }
  });

  it("tiles 0–1 without gaps, and every rest sits inside its chapter", () => {
    expect(CHAPTERS[0]!.start).toBe(0);
    expect(CHAPTERS.at(-1)!.end).toBe(1);
    CHAPTERS.forEach((chapter, index) => {
      if (index > 0) expect(chapter.start).toBeCloseTo(CHAPTERS[index - 1]!.end, 10);
      for (const rest of chapter.rests) {
        expect(rest.start).toBeGreaterThanOrEqual(chapter.start);
        expect(rest.end).toBeLessThanOrEqual(chapter.end);
        expect(rest.end).toBeGreaterThan(rest.start);
      }
    });
  });

  it("finds the chapter for a progress value and the deep-link targets", () => {
    expect(chapterAt(0).id).toBe("apex");
    expect(chapterAt(0.2).id).toBe("ascent");
    expect(chapterAt(0.6).id).toBe("blocks");
    expect(chapterAt(1).id).toBe("base");
    expect(restTarget("faces")).toBe(0.31);
    expect(restTarget("blocks")).toBe(0.58);
  });

  it("fades a beat in before its rest and out after it", () => {
    const rest = { start: 0.31, end: 0.33 };
    expect(beatVisibility(0.31, rest)).toBe(1);
    expect(beatVisibility(0.33, rest)).toBe(1);
    expect(beatVisibility(0.31 - BEAT_FADE, rest)).toBe(0);
    expect(beatVisibility(0.33 + BEAT_FADE, rest)).toBe(0);
    expect(beatVisibility(0.3, rest)).toBeCloseTo(0.5, 10);
  });

  it("does not show two beats fully at the same time", () => {
    for (const p of SAMPLES) {
      const visible = ALL_RESTS.filter((rest) => beatVisibility(p, rest) === 1);
      expect(visible.length).toBeLessThanOrEqual(1);
    }
  });

  it("knows which chapter is resting, tolerating whole-pixel rounding", () => {
    expect(restingChapter(0.03)).toBe("apex");
    expect(restingChapter(0.18996)).toBe("ascent");
    expect(restingChapter(0.15)).toBeNull();
    expect(restingChapter(0.7)).toBe("blocks");
  });

  it("steps from rest to rest with PageDown / PageUp", () => {
    expect(adjacentRest(0, 1)?.start).toBe(0.19);
    expect(adjacentRest(0.19, 1)?.start).toBe(0.31);
    expect(adjacentRest(0.31, -1)?.start).toBe(0.19);
    expect(adjacentRest(0.96, 1)).toBeNull();
    expect(adjacentRest(0, -1)).toBeNull();
  });
});

describe("story tracks", () => {
  const state = createStoryState();

  it("is a pure function of progress (the same frame from above and below)", () => {
    const forward = SAMPLES.map((p) => JSON.stringify(evaluateStory(p, state)));
    const backward = [...SAMPLES].reverse().map((p) => JSON.stringify(evaluateStory(p, state)));
    expect(backward.reverse()).toEqual(forward);
  });

  it("starts in the hero pose and ends assembled", () => {
    evaluateStory(0, state);
    expect(state).toMatchObject({ breath: 1, glass: 1, invert: 0, explode: 0, yaw: HERO_YAW });
    evaluateStory(1, state);
    expect(state.assemble).toBe(1);
    expect(state.invert).toBe(0);
    expect(state.halo).toBe(1);
  });

  it("inverts the world from the pierce until Recently", () => {
    expect(evaluateStory(0.15, state).invert).toBe(0);
    expect(evaluateStory(0.2, state).invert).toBe(1);
    expect(evaluateStory(0.6, state).invert).toBe(1);
    expect(evaluateStory(0.83, state).invert).toBe(0);
    expect(evaluateStory(PIERCE - 0.001, state).glass).toBe(1);
    expect(evaluateStory(PIERCE, state).glass).toBe(0);
  });

  it("holds the pyramid still during each Faces rest and lights one face", () => {
    for (const [index, rest] of CHAPTERS.find((c) => c.id === "faces")!.rests.entries()) {
      const a = evaluateStory(rest.start, state).yaw;
      const b = evaluateStory(rest.end, state).yaw;
      expect(a).toBeCloseTo(b, 10);
      expect(evaluateStory((rest.start + rest.end) / 2, state)).toMatchObject({
        face: index,
        faceGlow: 1,
      });
    }
  });

  it("returns to the hero yaw (one full turn later) before the blocks fly apart", () => {
    const yaw = evaluateStory(0.5, state).yaw;
    expect(yaw).toBeCloseTo(HERO_YAW - 2 * Math.PI, 10);
  });

  it("moves every track smoothly: no jumps between neighbouring samples", () => {
    const keys = ["breath", "invert", "yaw", "dissolve", "explode", "assemble", "guide", "halo"] as const;
    let previous = { ...evaluateStory(0, state) };
    for (const p of SAMPLES.slice(1)) {
      const next = evaluateStory(p, state);
      for (const key of keys) {
        expect(Math.abs(next[key] - previous[key]), `${key} at ${p}`).toBeLessThan(0.15);
      }
      previous = { ...next };
    }
  });

  it("brings each featured block into focus during its rest", () => {
    CHAPTERS.find((c) => c.id === "blocks")!.rests.forEach((rest, index) => {
      expect(evaluateStory((rest.start + rest.end) / 2, state).focus[index]).toBe(1);
    });
  });
});

describe("camera path", () => {
  const sample = createCameraSample();
  const snapshot = (p: number) => {
    sampleCamera(p, sample);
    return { position: [...sample.position], target: [...sample.target], fov: sample.fov };
  };

  it("passes through every keyframe", () => {
    for (const frame of CAMERA_KEYFRAMES) {
      const at = snapshot(frame.p);
      at.position.forEach((value, axis) => expect(value).toBeCloseTo(frame.position[axis]!, 6));
      at.target.forEach((value, axis) => expect(value).toBeCloseTo(frame.target[axis]!, 6));
    }
  });

  it("holds perfectly still during every rest pose", () => {
    for (const rest of ALL_RESTS) {
      const start = snapshot(rest.start);
      for (let step = 1; step <= 10; step++) {
        const p = rest.start + ((rest.end - rest.start) * step) / 10;
        expect(snapshot(p)).toEqual(start);
      }
    }
  });

  it("moves continuously, without teleporting", () => {
    let previous = snapshot(0);
    for (const p of SAMPLES.slice(1)) {
      const next = snapshot(p);
      const distance = Math.hypot(
        next.position[0]! - previous.position[0]!,
        next.position[1]! - previous.position[1]!,
        next.position[2]! - previous.position[2]!,
      );
      expect(distance, `camera jump at ${p}`).toBeLessThan(0.35);
      previous = next;
    }
  });

  it("never looks along its up vector (lookAt would flip)", () => {
    for (const p of SAMPLES) {
      sampleCamera(p, sample);
      const direction = sample.target.map((value, axis) => value - sample.position[axis]!);
      const length = Math.hypot(...direction);
      const alignment = Math.abs(
        direction.reduce((sum, value, axis) => sum + (value / length) * sample.up[axis]!, 0),
      );
      expect(alignment, `up parallel to view at ${p}`).toBeLessThan(0.97);
    }
  });

  it("stays inside the hollow pyramid while the manifesto is read", () => {
    const halfSide = SHELL.radius / Math.SQRT2;
    for (let p = 0.175; p <= 0.24; p += 0.001) {
      sampleCamera(p, sample);
      const [x, y, z] = sample.position;
      const halfAtY = (halfSide * (1.1 - y)) / 2.2 - SHELL.thickness;
      // Distance to the walls of the diamond-oriented square in the xz plane.
      expect((Math.abs(x) + Math.abs(z)) / Math.SQRT2, `outside at ${p}`).toBeLessThan(halfAtY);
    }
  });

  it("widens the field of view on portrait screens only", () => {
    expect(fitFov(35, 1.6)).toBe(35);
    expect(fitFov(35, 0.46)).toBeGreaterThan(45);
    expect(fitFov(35, 0.46)).toBeLessThan(55);
  });
});

describe("block shell", () => {
  const shell = buildBlockShell();

  it("has 48 wall slabs plus the cap, three of them featured", () => {
    const slabs = SHELL.bands.reduce((sum, count) => sum + count * 4, 0);
    expect(shell.pieces).toHaveLength(slabs + 1);
    expect(shell.pieces.filter((piece) => piece.featured > 0).map((piece) => piece.featured).sort()).toEqual([1, 2, 3]);
    expect(shell.mesh.count % 3).toBe(0);
    expect(shell.edges.count % 2).toBe(0);
  });

  it("fits inside the glass pyramid it replaces", () => {
    const { position, count } = shell.mesh;
    for (let index = 0; index < count; index++) {
      const x = position[index * 3]!;
      const y = position[index * 3 + 1]!;
      const z = position[index * 3 + 2]!;
      expect(y).toBeGreaterThanOrEqual(-1.1 - 1e-6);
      expect(y).toBeLessThanOrEqual(1.1 + 1e-6);
      // Base corners on the axes: |x| + |z| ≤ radius at the base, shrinking to the apex.
      expect(Math.abs(x) + Math.abs(z)).toBeLessThanOrEqual((SHELL.radius * (1.1 - y)) / 2.2 + 1e-6);
    }
  });

  it("sends each featured block to its composed position", () => {
    const { center, offset, featured, count } = shell.mesh;
    for (let index = 0; index < count; index++) {
      const which = featured[index]!;
      if (which === 0) continue;
      const local = [0, 1, 2].map((axis) => center[index * 3 + axis]! + offset[index * 3 + axis]!);
      // Undo the pyramid's yaw during Blocks to compare with world space.
      const cos = Math.cos(HERO_YAW);
      const sin = Math.sin(HERO_YAW);
      const world = [local[0]! * cos + local[2]! * sin, local[1]!, -local[0]! * sin + local[2]! * cos];
      world.forEach((value, axis) => expect(value).toBeCloseTo(FEATURED_BLOCKS[which - 1]![axis]!, 5));
    }
  });

  it("moves the cap off the camera's axis", () => {
    expect(Math.hypot(CAP_LIFT[0], CAP_LIFT[2])).toBeGreaterThan(0.5);
  });
});
