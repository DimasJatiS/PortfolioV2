"use client";

import { useEffect } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";
import { STORAGE_KEYS } from "@/lib/site";
import { readStorage } from "@/lib/storage";
import { isTheme, useAppStore } from "@/lib/store";

/**
 * Connects the store to the browser: adopts the theme the inline script chose,
 * restores the sound preference, and tracks reduced motion and the pointer.
 * Renders nothing.
 */
export function AppEffects() {
  useEffect(() => {
    const store = useAppStore;

    // The inline ThemeScript already set data-theme; the store adopts it.
    const applied = document.documentElement.getAttribute("data-theme");
    if (isTheme(applied)) store.setState({ theme: applied });

    // Sound never starts on its own (PRD 9.2); only an explicit "on" is restored.
    store.setState({ sound: readStorage(STORAGE_KEYS.sound) === "on" });

    const cleanups: Array<() => void> = [];

    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const onMotionChange = () => store.getState().setReducedMotion(motionQuery.matches);
    onMotionChange();
    motionQuery.addEventListener("change", onMotionChange);
    cleanups.push(() => motionQuery.removeEventListener("change", onMotionChange));

    // Follow the system theme only while the visitor has not chosen one.
    const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = () => {
      if (isTheme(readStorage(STORAGE_KEYS.theme))) return;
      const theme = schemeQuery.matches ? "night" : "day";
      document.documentElement.setAttribute("data-theme", theme);
      store.setState({ theme });
    };
    schemeQuery.addEventListener("change", onSchemeChange);
    cleanups.push(() => schemeQuery.removeEventListener("change", onSchemeChange));

    // Pointer parallax is a fine-pointer effect; touch devices skip the listener.
    if (window.matchMedia("(pointer: fine)").matches) {
      const onPointerMove = (event: PointerEvent) => {
        store
          .getState()
          .setPointer(
            (event.clientX / window.innerWidth) * 2 - 1,
            (event.clientY / window.innerHeight) * 2 - 1,
          );
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      cleanups.push(() => window.removeEventListener("pointermove", onPointerMove));
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
