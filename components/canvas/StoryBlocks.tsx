"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Vector3,
  type Mesh,
  type ShaderMaterial,
} from "three";
import { buildBlockShell, CAP_LIFT, type VertexData } from "@/lib/pyramid-blocks";
import { useAppStore } from "@/lib/store";
import type { StoryState } from "@/lib/story";
import { palette } from "@/lib/tokens";
import {
  blockEdgesFragmentShader,
  blockEdgesVertexShader,
  blocksFragmentShader,
  blocksVertexShader,
} from "@/shaders/blocks";

function toGeometry(data: VertexData): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(data.position, 3));
  geometry.setAttribute("normal", new BufferAttribute(data.normal, 3));
  geometry.setAttribute("aCenter", new BufferAttribute(data.center, 3));
  geometry.setAttribute("aOffset", new BufferAttribute(data.offset, 3));
  geometry.setAttribute("aSpin", new BufferAttribute(data.spin, 3));
  geometry.setAttribute("aLayer", new BufferAttribute(data.layer, 1));
  geometry.setAttribute("aSeed", new BufferAttribute(data.seed, 1));
  geometry.setAttribute("aFace", new BufferAttribute(data.face, 1));
  geometry.setAttribute("aFeatured", new BufferAttribute(data.featured, 1));
  return geometry;
}

/** Block colours on a light world (ivory) and on a dark one (green). */
const LIGHT = {
  base: new Color(palette["sage-300"]),
  high: new Color(palette["ivory-50"]),
  line: new Color(palette["green-700"]),
};
// Dark enough that ivory text stays readable over the walls inside the pyramid.
const DARK = {
  base: new Color(palette["green-950"]),
  high: new Color(palette["green-700"]),
  line: new Color(palette["sage-300"]),
};
const ACCENT = new Color(palette["orange-500"]);

function createUniforms() {
  // One set per material: the frame loop writes the same values into both.
  const motion = () => ({
    uTime: { value: 0 },
    uBreath: { value: 1 },
    uExplode: { value: 0 },
    uAssemble: { value: 0 },
    uCapLift: { value: 0 },
    uCapOffset: { value: new Vector3(...CAP_LIFT) },
  });
  return {
    mesh: {
      ...motion(),
      uBase: { value: LIGHT.base.clone() },
      uHigh: { value: LIGHT.high.clone() },
      uAccent: { value: ACCENT.clone() },
      uDissolve: { value: 0 },
      uFace: { value: 0 },
      uFaceGlow: { value: 0 },
      uFocus: { value: new Vector3() },
    },
    edges: {
      ...motion(),
      uLine: { value: LIGHT.line.clone() },
      uGlow: { value: ACCENT.clone() },
      uOpacity: { value: 0.3 },
      uGlowAmount: { value: 1 },
      uFace: { value: 0 },
      uFaceGlow: { value: 0 },
    },
  };
}

type Uniforms = ReturnType<typeof createUniforms>;

/**
 * The pyramid as 49 blocks in one draw call, plus their edges in a second.
 * Everything it shows is read from the story state each frame; it owns no
 * animation of its own (Spesifikasi Lanjutan 11.1–11.2).
 */
export function StoryBlocks({ story }: { story: RefObject<StoryState> }) {
  const meshRef = useRef<Mesh>(null);
  const meshMaterial = useRef<ShaderMaterial>(null);
  const edgeMaterial = useRef<ShaderMaterial>(null);

  const { meshGeometry, edgeGeometry, uniforms } = useMemo(() => {
    const shell = buildBlockShell();
    return {
      meshGeometry: toGeometry(shell.mesh),
      edgeGeometry: toGeometry(shell.edges),
      uniforms: createUniforms(),
    };
  }, []);

  useEffect(
    () => () => {
      meshGeometry.dispose();
      edgeGeometry.dispose();
    },
    [meshGeometry, edgeGeometry],
  );

  useFrame((state) => {
    const s = story.current;
    const mesh = meshMaterial.current;
    const edges = edgeMaterial.current;
    if (!mesh || !edges) return;
    const u = mesh.uniforms as Uniforms["mesh"];
    const e = edges.uniforms as Uniforms["edges"];
    const { theme, frozen } = useAppStore.getState();

    // Same motion on both materials, so the edges stay on their blocks.
    // (Written out, not looped over an array: no allocation per frame.)
    const time = frozen ? 0 : state.clock.elapsedTime;
    u.uTime.value = e.uTime.value = time;
    u.uBreath.value = e.uBreath.value = s.breath;
    u.uExplode.value = e.uExplode.value = s.explode;
    u.uAssemble.value = e.uAssemble.value = s.assemble;
    u.uCapLift.value = e.uCapLift.value = s.capLift;

    // Inside the inverted world a light theme turns dark, and the reverse.
    const dark = theme === "night" ? 1 - s.invert : s.invert;
    u.uBase.value.lerpColors(LIGHT.base, DARK.base, dark);
    u.uHigh.value.lerpColors(LIGHT.high, DARK.high, dark);
    e.uLine.value.lerpColors(LIGHT.line, DARK.line, dark);

    u.uDissolve.value = s.dissolve;
    u.uFace.value = s.face;
    u.uFaceGlow.value = s.faceGlow;
    e.uFace.value = s.face;
    e.uFaceGlow.value = s.faceGlow;
    u.uFocus.value.set(s.focus[0], s.focus[1], s.focus[2]);

    // Seams: faint through the glass and glowing while the blocks breathe; the
    // full wireframe once the glass dissolves.
    const glass = s.glass > 0.5;
    if (meshRef.current) meshRef.current.visible = !glass;
    e.uOpacity.value = glass ? 0.3 : 0.28 + 0.62 * s.dissolve;
    e.uGlowAmount.value = Math.max(s.breath, s.core * 0.6);
  });

  return (
    <group>
      {/* Hidden while the transmission pyramid is shown; the edges stay as seams. */}
      <mesh ref={meshRef} geometry={meshGeometry} frustumCulled={false} visible={false}>
        <shaderMaterial
          ref={meshMaterial}
          vertexShader={blocksVertexShader}
          fragmentShader={blocksFragmentShader}
          uniforms={uniforms.mesh}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments geometry={edgeGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={edgeMaterial}
          vertexShader={blockEdgesVertexShader}
          fragmentShader={blockEdgesFragmentShader}
          uniforms={uniforms.edges}
          transparent
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
