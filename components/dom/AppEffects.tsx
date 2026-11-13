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

    // The inline ThemeScript normally set data-theme before first paint, and the
    // store just adopts it. Pages that Next.js renders on the client never run
    // that script, and every 404 is one of them (a `notFound()` response is an
    // empty error shell that the router fills in). So resolve the theme again
    // with the same precedence — stored choice, then the system — and correct
    // the document when it disagrees.
    const stored = readStorage(STORAGE_KEYS.theme);
    const theme = isTheme(stored)
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "night"
        : "day";
    if (document.documentElement.getAttribute("data-theme") !== theme) {
      document.documentElement.setAttribute("data-theme", theme);
    }
    store.setState({ theme });

    // Sound never starts on its own (PRD 9.2); only an explicit "on" is restored.
    store.setState({ sound: readStorage(STORAGE_KEYS.sound) === "on" });

    const cleanups: Array<() => void> = [];

    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const onMotionChange = () => {
      store.getState().setReducedMotion(motionQuery.matches);
      // The Home story follows the setting live; ThemeScript set it before paint.
      document.documentElement.classList.toggle("story", !motionQuery.matches);
      if (motionQuery.matches) store.getState().setStory(false);
    };
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
