"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { StaticPrism } from "@/components/dom/StaticPrism";
import { usePathname } from "@/i18n/navigation";
import {
  detectQualityTier,
  isWebGLAvailable,
  type QualityTier,
} from "@/lib/quality-tier";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SceneMode } from "./constants";

// three.js, R3F and drei are only downloaded when the scene is actually going
// to render, and never block the hero's HTML (PRD 9.1).
const Scene = dynamic(() => import("./Scene"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("[scene] The 3D scene crashed; showing the static fallback.", error);
    useAppStore.getState().setWebgl("failed");
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

const TIERS: readonly QualityTier[] = ["high", "medium", "low"];

interface DebugFlags {
  forcedTier: QualityTier | null;
  showPerf: boolean;
}

function readDebugFlags(): DebugFlags {
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("tier");
    return {
      forcedTier: TIERS.find((tier) => tier === requested) ?? null,
      showPerf: params.has("perf"),
    };
  } catch {
    return { forcedTier: null, showPerf: false };
  }
}

/**
 * The persistent background layer. It lives in the root layout, so navigating
 * between pages never unmounts the canvas.
 *
 * It always renders the static SVG prism first. The WebGL scene replaces it only
 * when the device can afford it:
 *
 *   no WebGL / context lost / scene error → static prism
 *   tier low (weak GPU, or FPS < 30 for 2s) → static prism
 *   tier medium / high                      → live scene
 *   prefers-reduced-motion                  → live scene, one still frame
 *
 * The wrapper is `aria-hidden`; pages provide the text alternative.
 */
export function CanvasRoot() {
  const pathname = usePathname();
  const mode: SceneMode = pathname === "/" ? "hero" : "ambient";

  const tier = useAppStore((state) => state.tier);
  const webgl = useAppStore((state) => state.webgl);
  const sceneReady = useAppStore((state) => state.sceneReady);

  const [debug, setDebug] = useState<DebugFlags>({ forcedTier: null, showPerf: false });
  const [tabVisible, setTabVisible] = useState(true);
  const [inView, setInView] = useState(true);

  // Capability detection, once.
  useEffect(() => {
    let cancelled = false;
    const store = useAppStore.getState();
    const flags = readDebugFlags();

    const settle = (detected: QualityTier, supported: boolean) => {
      if (cancelled) return;
      setDebug(flags);
      store.setTier(detected);
      store.setWebgl(supported ? "ready" : "unsupported");
    };

    if (!isWebGLAvailable()) {
      settle("low", false);
    } else if (flags.forcedTier) {
      settle(flags.forcedTier, true);
    } else {
      void detectQualityTier().then((detected) => settle(detected, true));
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Pause rendering while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // On editorial pages the scene only belongs to the page header: once that has
  // scrolled away, fade the layer out and stop rendering.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      // Home: while the hero is on screen. Editorial pages: while the header is.
      const limit = window.innerHeight * (mode === "hero" ? 0.95 : 0.55);
      setInView(window.scrollY < limit);
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mode]);

  const liveTier = webgl === "ready" && tier !== null && tier !== "low" ? tier : null;
  const showStatic = liveTier === null || !sceneReady;

  return (
    <div
      aria-hidden="true"
      data-scene={liveTier ? (sceneReady ? "webgl" : "loading") : "static"}
      data-tier={tier ?? "pending"}
      className={cn(
        "no-print ease-light pointer-events-none fixed inset-0 z-0 transition-opacity duration-(--dur-m)",
        inView ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "ease-inout absolute transition-[opacity,transform] duration-(--dur-l)",
          mode === "hero"
            ? "top-[40%] left-1/2 aspect-square w-[min(88vw,58vh)] -translate-x-1/2 -translate-y-1/2"
            : "top-[calc(var(--nav-height)+0.5rem)] right-[max(0.5rem,5vw)] aspect-square w-[min(40vw,30vh)]",
          showStatic ? "opacity-100" : "opacity-0",
        )}
      >
        <StaticPrism />
      </div>

      {liveTier && (
        <SceneBoundary>
          <div
            className={cn(
              "ease-light absolute inset-0 transition-opacity duration-(--dur-l)",
              sceneReady ? "opacity-100" : "opacity-0",
            )}
          >
            <Scene
              tier={liveTier}
              mode={mode}
              active={tabVisible && inView}
              locked={debug.forcedTier !== null}
              showPerf={debug.showPerf}
            />
          </div>
        </SceneBoundary>
      )}
    </div>
  );
}
