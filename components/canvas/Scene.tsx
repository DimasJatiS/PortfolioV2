"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useRef, useState } from "react";
import { NeutralToneMapping, type Group } from "three";
import { damp3d } from "@/lib/motion";
import { QUALITY, type QualitySettings } from "@/lib/quality-tier";
import { useAppStore } from "@/lib/store";
import { ApexFlare } from "./ApexFlare";
import { CAMERA, PYRAMID, type SceneMode } from "./constants";
import { PerfHud } from "./PerfHud";
import { Pyramid } from "./Pyramid";
import { Rays } from "./Rays";
import { SceneEnvironment } from "./SceneEnvironment";
import { StoryRig } from "./StoryRig";

interface SceneProps {
  tier: "high" | "medium";
  mode: SceneMode;
  /** `false` pauses the render loop (tab hidden, or the 3D area scrolled away). */
  active: boolean;
  /** When the tier was forced through `?tier=`, never auto-degrade. */
  locked: boolean;
  showPerf: boolean;
}

/** Radians per second of idle rotation. */
const IDLE_SPIN = 0.16;

/**
 * Holds the pyramid and moves it between the hero placement and the smaller,
 * off-centre placement used behind the editorial pages. Everything is damped
 * with maath, so motion is frame-rate independent.
 */
function Rig({ mode, quality }: { mode: Exclude<SceneMode, "story">; quality: QualitySettings }) {
  const group = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);

  useFrame((_, delta) => {
    const { pointer, reducedMotion } = useAppStore.getState();
    const smooth = reducedMotion ? 0 : 1 / damp3d.default;

    // Fit the pyramid to narrow (portrait) viewports instead of cropping it.
    const fit = Math.min(1, viewport.width / (PYRAMID.radius * 2 * 1.35));
    const hero = mode === "hero";
    // Hero: the pyramid sits between the eyebrow and the statement, so the name
    // crosses its middle (like the summit key visual) and the copy stays clear.
    const scale = hero ? fit * 0.72 : fit * 0.42;
    const x = hero ? 0 : viewport.width * 0.3;
    // Editorial pages on phones: tuck the pyramid into the band between the nav
    // and the title (PageHeader reserves it), so it never sits behind the text.
    // 768px is the `md` breakpoint that the static pyramid and PageHeader use.
    const narrow = size.width < 768;
    const y = hero ? 0.41 : viewport.height * (narrow ? 0.36 : 0.22);

    if (group.current) {
      easing.damp3(group.current.position, [x, y, 0], smooth, delta);
      easing.damp3(group.current.scale, scale, smooth, delta);
    }

    if (spin.current && !reducedMotion) {
      spin.current.rotation.y += delta * IDLE_SPIN;
    }

    // Cursor parallax: a small orbit of the camera around the scene centre.
    const px = reducedMotion ? 0 : pointer.x * CAMERA.parallax.x;
    const py = reducedMotion ? 0 : -pointer.y * CAMERA.parallax.y;
    easing.damp3(
      camera.position,
      [CAMERA.position[0] + px, CAMERA.position[1] + py, CAMERA.position[2]],
      smooth,
      delta,
    );
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      {/* A quarter turn offset shows an edge towards the camera: two faces, like the key visual. */}
      <group ref={spin} rotation-y={Math.PI / 5}>
        <Pyramid quality={quality} />
        <Rays count={quality.rayCount} />
      </group>
      {/* Outside the spinning group: the apex is on the rotation axis, and a
          billboard under a rotating parent would smear its streak. */}
      <ApexFlare />
    </group>
  );
}

/** Reports the first drawn frame, which is when the static fallback can fade out. */
function FirstFrame() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    useAppStore.getState().setSceneReady(true);
  });
  useEffect(() => () => useAppStore.getState().setSceneReady(false), []);
  return null;
}

/** In `frameloop="demand"` (reduced motion) a theme change still needs one new frame. */
function InvalidateOnChange({ mode }: { mode: SceneMode }) {
  const invalidate = useThree((state) => state.invalidate);
  const theme = useAppStore((state) => state.theme);
  useEffect(() => {
    invalidate();
  }, [invalidate, theme, mode]);
  return null;
}

export default function Scene({ tier, mode, active, locked, showPerf }: SceneProps) {
  const quality = QUALITY[tier];
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const [minDpr, maxDpr] = quality.dpr;
  const [dpr, setDpr] = useState(maxDpr);
  // The cap changes with the tier; never render above it. Passing a range lets
  // R3F clamp to the device's own pixel ratio, so a 1x screen is not supersampled.
  const dprRange: [number, number] = [Math.min(minDpr, dpr), Math.min(dpr, maxDpr)];

  const frameloop = !active ? "never" : reducedMotion ? "demand" : "always";

  return (
    <Canvas
      frameloop={frameloop}
      dpr={dprRange}
      camera={{ fov: CAMERA.fov, position: CAMERA.position, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        // Neutral tone mapping keeps the brand colours true while taming HDRI highlights.
        gl.toneMapping = NeutralToneMapping;
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            // The GPU dropped the context (driver reset, memory pressure).
            // Fall back to the static pyramid instead of showing a dead canvas.
            event.preventDefault();
            console.warn("[scene] WebGL context lost; switching to the static fallback.");
            useAppStore.getState().setWebgl("failed");
          },
          { once: true },
        );
      }}
    >
      {!locked && !reducedMotion && (
        <PerformanceMonitor
          // Eight 250ms samples = the two-second window from PRD 7.4.
          ms={250}
          iterations={8}
          bounds={() => [30, 55]}
          step={0.25}
          onChange={({ factor }) => {
            const next = minDpr + (maxDpr - minDpr) * factor;
            setDpr(Math.round(next * 4) / 4);
          }}
          onDecline={({ factor }) => {
            // Already at the lowest resolution and still under 30 fps: drop a tier.
            if (factor <= 0) useAppStore.getState().degradeTier();
          }}
          flipflops={4}
          onFallback={() => setDpr(minDpr)}
        />
      )}

      <SceneEnvironment />
      {mode === "story" ? <StoryRig quality={quality} /> : <Rig mode={mode} quality={quality} />}
      <FirstFrame />
      <InvalidateOnChange mode={mode} />
      {showPerf && <PerfHud />}
    </Canvas>
  );
}
