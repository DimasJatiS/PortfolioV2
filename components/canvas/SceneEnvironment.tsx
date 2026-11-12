"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { Component, Suspense, type ReactNode } from "react";
import { damp3d } from "@/lib/motion";
import { useAppStore } from "@/lib/store";

const HDRI_PATH = "/hdri/studio_small_03_512.hdr";

/** Day is a bright studio; Night dims the same environment (PRD: darker HDRI preset). */
const ENV_INTENSITY = { day: 1, night: 0.32 } as const;

/**
 * A procedural studio made of light cards. Used while the HDRI downloads and as
 * the permanent environment if that download fails, so the glass always has
 * something to reflect.
 */
function ProceduralStudio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#d9d6cf"]} />
      <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[8, 3, 1]} />
      <Lightformer
        form="rect"
        intensity={1.6}
        position={[-5, 1, 1]}
        scale={[3, 6, 1]}
        rotation-y={Math.PI / 2}
      />
      <Lightformer
        form="rect"
        intensity={1.2}
        position={[5, 1, -1]}
        scale={[3, 6, 1]}
        rotation-y={-Math.PI / 2}
      />
      <Lightformer form="ring" intensity={2} position={[0, 1, -6]} scale={3} />
    </Environment>
  );
}

class EnvironmentBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.warn(
      "[scene] HDRI failed to load; using the procedural studio instead.",
      error,
    );
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function EnvironmentIntensity() {
  const scene = useThree((state) => state.scene);
  useFrame((_, delta) => {
    const { theme, reducedMotion } = useAppStore.getState();
    easing.damp(
      scene,
      "environmentIntensity",
      ENV_INTENSITY[theme],
      reducedMotion ? 0 : 1 / damp3d.max,
      delta,
    );
  });
  return null;
}

/** Image-based lighting from the Poly Haven studio HDRI, plus one key light for edge highlights. */
export function SceneEnvironment() {
  return (
    <>
      <EnvironmentBoundary fallback={<ProceduralStudio />}>
        <Suspense fallback={<ProceduralStudio />}>
          <Environment files={HDRI_PATH} />
        </Suspense>
      </EnvironmentBoundary>
      <EnvironmentIntensity />
      <directionalLight position={[3, 4, 2.5]} intensity={1.4} />
    </>
  );
}
