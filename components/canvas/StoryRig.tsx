"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useRef } from "react";
import { Vector3, type Group, type PerspectiveCamera } from "three";
import { createCameraSample, fitFov, sampleCamera } from "@/lib/camera-path";
import type { QualitySettings } from "@/lib/quality-tier";
import { useAppStore } from "@/lib/store";
import { createStoryState, evaluateStory } from "@/lib/story";
import { ApexFlare } from "./ApexFlare";
import { CAMERA } from "./constants";
import { Pyramid } from "./Pyramid";
import { Rays } from "./Rays";
import { StoryBlocks } from "./StoryBlocks";

/** The near plane while flying inside the hollow pyramid (Spesifikasi Lanjutan 10.2). */
const STORY_NEAR = 0.03;

/**
 * Home story: everything in the scene is a function of the damped story
 * progress in the store (`scroll`). The camera follows the keyframed path; the
 * pyramid yaws through the Faces; the glass pyramid hands over to the block
 * shell when the camera pierces it.
 */
export function StoryRig({ quality }: { quality: QualitySettings }) {
  const getThree = useThree((state) => state.get);

  // Per-frame state lives in refs: written in useFrame, never during render.
  const story = useRef(createStoryState());
  const sample = useRef(createCameraSample());
  const lookAt = useRef(new Vector3());
  const pointer = useRef({ x: 0, y: 0 });
  const yawGroup = useRef<Group>(null);
  const glassGroup = useRef<Group>(null);
  const rays = useRef(1);
  const flare = useRef(1);

  useEffect(() => {
    const camera = getThree().camera as PerspectiveCamera;
    const previousNear = camera.near;
    camera.near = STORY_NEAR;
    camera.updateProjectionMatrix();
    return () => {
      camera.near = previousNear;
      camera.up.set(0, 1, 0);
      camera.updateProjectionMatrix();
    };
  }, [getThree]);

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const { scroll, pointer: cursor, frozen } = useAppStore.getState();
    const s = evaluateStory(scroll, story.current);
    const path = sampleCamera(scroll, sample.current);

    // Cursor parallax, ±3° in the hero only; it fades out as the story starts.
    easing.damp(pointer.current, "x", cursor.x, 0.25, delta);
    easing.damp(pointer.current, "y", cursor.y, 0.25, delta);
    camera.position.set(
      path.position[0] + pointer.current.x * CAMERA.parallax.x * s.breath,
      path.position[1] - pointer.current.y * CAMERA.parallax.y * s.breath,
      path.position[2],
    );
    camera.up.set(path.up[0], path.up[1], path.up[2]);
    camera.lookAt(lookAt.current.set(path.target[0], path.target[1], path.target[2]));

    const fov = fitFov(path.fov, state.size.width / Math.max(1, state.size.height));
    if (Math.abs(camera.fov - fov) > 1e-4) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    if (yawGroup.current) {
      const idle = frozen ? 0 : Math.sin(state.clock.elapsedTime * 0.3) * 0.04 * s.breath;
      yawGroup.current.rotation.y = s.yaw + idle;
    }
    if (glassGroup.current) glassGroup.current.visible = s.glass > 0.5;
    rays.current = s.rays;
    flare.current = s.flare;
    // Priority −1: evaluate the story before the children read it this frame.
    // (Negative priorities keep R3F's automatic rendering; only positive ones take it over.)
  }, -1);

  return (
    <>
      <group ref={yawGroup}>
        <group ref={glassGroup}>
          <Pyramid quality={quality} />
        </group>
        <Rays count={quality.rayCount} visibility={rays} />
        <StoryBlocks story={story} />
      </group>
      {/* Outside the yawing group: a billboard under a rotating parent smears its streak. */}
      <ApexFlare visibility={flare} />
    </>
  );
}
