"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useMemo, useRef, type RefObject } from "react";
import { AdditiveBlending, Color, NormalBlending, type ShaderMaterial } from "three";
import { damp3d } from "@/lib/motion";
import { useAppStore } from "@/lib/store";
import { palette, sceneColors } from "@/lib/tokens";
import { flareFragmentShader, flareVertexShader } from "@/shaders/flare";
import { APEX_Y } from "./constants";

const FLARE_SIZE = 1.5;

/**
 * The orange light at the apex. On ivory it uses normal blending (additive
 * light disappears on a light background); in Night it switches to additive and
 * burns brighter, as the PRD asks.
 */
export function ApexFlare({ visibility }: { visibility?: RefObject<number> }) {
  const materialRef = useRef<ShaderMaterial>(null);
  // Theme brightness, eased. The story's visibility multiplies it undamped, so
  // the flare is gone exactly when the camera passes through the apex.
  const brightness = useRef({ value: 1 });

  const uniforms = useMemo(
    () => ({
      uCore: { value: new Color(sceneColors.day.flareCore) },
      uGlow: { value: new Color(palette["orange-500"]) },
      uTime: { value: 0 },
      uIntensity: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const { theme, reducedMotion, frozen } = useAppStore.getState();
    const u = material.uniforms as typeof uniforms;
    const night = theme === "night";

    // Reduced motion: hold the flare at its resting brightness, no pulse.
    u.uTime.value = reducedMotion || frozen ? 1 : state.clock.elapsedTime;
    easing.damp(
      brightness.current,
      "value",
      night ? 1.35 : 1,
      reducedMotion ? 0 : 1 / damp3d.max,
      delta,
    );
    u.uIntensity.value = brightness.current.value * (visibility?.current ?? 1);

    const blending = night ? AdditiveBlending : NormalBlending;
    if (material.blending !== blending) {
      material.blending = blending;
      material.needsUpdate = true;
    }
  });

  return (
    <Billboard position={[0, APEX_Y, 0]} renderOrder={10}>
      <mesh>
        <planeGeometry args={[FLARE_SIZE, FLARE_SIZE]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={flareVertexShader}
          fragmentShader={flareFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </Billboard>
  );
}
