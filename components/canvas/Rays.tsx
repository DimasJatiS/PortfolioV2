"use client";

import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Vector2,
  type ShaderMaterial,
} from "three";
import { damp3d, duration, stagger } from "@/lib/motion";
import { useAppStore } from "@/lib/store";
import { sceneColors } from "@/lib/tokens";
import { raysFragmentShader, raysVertexShader } from "@/shaders/rays";
import { APEX_Y, BASE_Y, PYRAMID } from "./constants";

/** Sits a hair outside the glass so the lines never z-fight with the faces. */
const SURFACE_OFFSET = 1.004;

function buildGeometry(count: number): BufferGeometry {
  const positions = new Float32Array(count * 2 * 3);
  const t = new Float32Array(count * 2);
  const index = new Float32Array(count * 2);

  // Base corners of the square pyramid, matching ConeGeometry's layout.
  const corners = Array.from({ length: PYRAMID.sides }, (_, side) => {
    const angle = (side / PYRAMID.sides) * Math.PI * 2;
    return [Math.sin(angle) * PYRAMID.radius, Math.cos(angle) * PYRAMID.radius] as const;
  });

  for (let ray = 0; ray < count; ray++) {
    // Walk the base perimeter; every ray lands on an edge, so it lies on a face.
    const along = (ray / count) * PYRAMID.sides;
    const side = Math.floor(along) % PYRAMID.sides;
    const local = along - Math.floor(along);
    const from = corners[side] ?? [0, 0];
    const to = corners[(side + 1) % PYRAMID.sides] ?? [0, 0];
    const x = from[0] + (to[0] - from[0]) * local;
    const z = from[1] + (to[1] - from[1]) * local;

    const offset = ray * 6;
    positions.set([0, APEX_Y, 0, x, BASE_Y, z], offset);
    t.set([0, 1], ray * 2);
    const order = count > 1 ? ray / (count - 1) : 0;
    index.set([order, order], ray * 2);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aT", new BufferAttribute(t, 1));
  geometry.setAttribute("aIndex", new BufferAttribute(index, 1));
  return geometry;
}

/**
 * 24–40 hairline rays from the apex to the base. They draw in one after another
 * (stagger-char, 20ms each) the first time the scene appears, then lean very
 * slightly with the cursor.
 */
export function Rays({ count }: { count: number }) {
  const materialRef = useRef<ShaderMaterial>(null);
  const progress = useRef(0);

  const geometry = useMemo(() => buildGeometry(count), [count]);

  const { uniforms, drawSeconds } = useMemo(() => {
    const staggerSeconds = (count * stagger.char) / 1000;
    const total = staggerSeconds + duration.m / 1000;
    return {
      drawSeconds: total,
      uniforms: {
        uProgress: { value: 0 },
        uStagger: { value: staggerSeconds / total },
        uPointer: { value: new Vector2() },
        uColor: { value: new Color(sceneColors.day.ray) },
        uOpacity: { value: 0.55 },
      },
    };
  }, [count]);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const { theme, reducedMotion, pointer } = useAppStore.getState();
    const u = material.uniforms as typeof uniforms;

    if (reducedMotion) {
      progress.current = 1;
      u.uPointer.value.set(0, 0);
      u.uColor.value.set(sceneColors[theme].ray);
    } else {
      progress.current = Math.min(1, progress.current + delta / drawSeconds);
      easing.damp2(u.uPointer.value, [pointer.x, pointer.y], 1 / damp3d.min, delta);
      easing.dampC(u.uColor.value, sceneColors[theme].ray, 1 / damp3d.max, delta);
    }
    u.uProgress.value = progress.current;
    u.uOpacity.value = theme === "night" ? 0.7 : 0.55;
  });

  return (
    <lineSegments geometry={geometry} scale={SURFACE_OFFSET} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={raysVertexShader}
        fragmentShader={raysFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </lineSegments>
  );
}
