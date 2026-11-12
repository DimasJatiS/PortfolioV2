"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

const SAMPLE_MS = 500;

/**
 * Minimal performance overlay for the 3D spike: FPS, draw calls, triangles, DPR
 * and the active quality tier. Enabled by adding `?perf` to the URL, on any
 * device, which makes it easy to check a phone against the budget
 * (>= 50 fps on desktop, <= 100 draw calls).
 */
export function PerfHud() {
  const gl = useThree((state) => state.gl);
  const element = useRef<HTMLDivElement | null>(null);
  const frames = useRef(0);
  const last = useRef(0);
  const lowest = useRef(Number.POSITIVE_INFINITY);

  useEffect(() => {
    const node = document.createElement("div");
    node.setAttribute("data-perf-hud", "");
    node.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:200;padding:6px 10px;border-radius:8px;" +
      "background:rgba(6,38,27,.88);color:#FBF8F1;font:12px/1.5 ui-monospace,Menlo,monospace;" +
      "pointer-events:none;white-space:pre";
    document.body.appendChild(node);
    element.current = node;
    return () => {
      node.remove();
      element.current = null;
    };
  }, []);

  useFrame(() => {
    frames.current += 1;
    const now = performance.now();
    if (last.current === 0) last.current = now;
    const elapsed = now - last.current;
    if (elapsed < SAMPLE_MS || !element.current) return;

    const fps = (frames.current * 1000) / elapsed;
    lowest.current = Math.min(lowest.current, fps);
    const { tier } = useAppStore.getState();
    const { calls, triangles } = gl.info.render;
    element.current.textContent =
      `fps   ${fps.toFixed(0)} (min ${lowest.current.toFixed(0)})\n` +
      `calls ${calls}  tris ${triangles}\n` +
      `dpr   ${gl.getPixelRatio().toFixed(2)}  tier ${tier ?? "-"}`;
    element.current.dataset.fps = fps.toFixed(1);
    element.current.dataset.calls = String(calls);

    frames.current = 0;
    last.current = now;
  });

  return null;
}
