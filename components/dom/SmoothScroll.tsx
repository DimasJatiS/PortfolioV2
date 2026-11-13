"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { setLenis } from "@/lib/smooth-scroll";

/**
 * Smooths wheel scrolling on every page (Spesifikasi Lanjutan 9.3). Scrolling
 * stays native: the scrollbar, anchors, find-in-page and zoom keep working, and
 * touch scrolling is untouched. Lenis itself honours `prefers-reduced-motion`
 * by tracking input 1:1. Renders nothing.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      stopInertiaOnNavigate: true,
    });
    setLenis(lenis);
    return () => {
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
