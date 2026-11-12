"use client";

import { MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useMemo, useRef } from "react";
import { Color, ConeGeometry, EdgesGeometry, type LineBasicMaterial } from "three";
import { damp3d } from "@/lib/motion";
import type { QualitySettings } from "@/lib/quality-tier";
import { useAppStore } from "@/lib/store";
import { palette, sceneColors } from "@/lib/tokens";
import { PYRAMID } from "./constants";

/**
 * Procedural glass pyramid — the placeholder for the Blender model (PRD 7.1).
 * It is a four-sided cone with flat-shaded faces; the .glb can replace this
 * component later without touching the rest of the scene.
 */
export function Pyramid({ quality }: { quality: QualitySettings }) {
  const edgesRef = useRef<LineBasicMaterial>(null);

  const geometry = useMemo(() => {
    const cone = new ConeGeometry(PYRAMID.radius, PYRAMID.height, PYRAMID.sides, 1);
    // ConeGeometry shares vertices around the cone, which smooths the faces.
    // Splitting them gives each triangle its own normal: crisp glass facets.
    const flat = cone.toNonIndexed();
    flat.computeVertexNormals();
    cone.dispose();
    return flat;
  }, []);

  // Only the real creases (apex edges and base), not the triangulation.
  const edges = useMemo(() => new EdgesGeometry(geometry, 15), [geometry]);

  // What the glass "sees" behind it. The canvas itself is transparent, so the
  // page background colour is fed to the refraction pass and eased on theme change.
  const background = useMemo(() => new Color(sceneColors.day.bgTop), []);
  const tint = useMemo(() => new Color(palette["ivory-50"]), []);
  const attenuation = useMemo(() => new Color(sceneColors.day.glassTint), []);

  useFrame((_, delta) => {
    const { theme, reducedMotion } = useAppStore.getState();
    const target = sceneColors[theme];
    // dur-m (600ms) feels like lambda ≈ 6; reduced motion snaps instead.
    const smooth = reducedMotion ? 0 : 1 / damp3d.max;
    easing.dampC(background, target.bgTop, smooth, delta);
    easing.dampC(attenuation, target.glassTint, smooth, delta);
    if (edgesRef.current) {
      easing.dampC(edgesRef.current.color, target.ray, smooth, delta);
    }
  });

  return (
    <mesh geometry={geometry} dispose={null}>
      <MeshTransmissionMaterial
        transmission={1}
        thickness={0.7}
        ior={1.5}
        roughness={0.03}
        envMapIntensity={0.45}
        specularIntensity={0.6}
        chromaticAberration={quality.chromaticAberration}
        anisotropicBlur={0.08}
        distortion={0}
        temporalDistortion={0}
        samples={quality.transmissionSamples}
        resolution={quality.transmissionResolution}
        backside={quality.backside}
        backsideThickness={0.3}
        background={background}
        color={tint}
        attenuationColor={attenuation}
        attenuationDistance={7}
      />
      {/* Thin edge lines stay visible as highlights and define the form on ivory. */}
      <lineSegments geometry={edges} scale={1.002}>
        <lineBasicMaterial
          ref={edgesRef}
          color={sceneColors.day.ray}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </lineSegments>
    </mesh>
  );
}
