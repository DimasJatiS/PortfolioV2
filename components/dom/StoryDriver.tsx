"use client";

import { useEffect } from "react";
import {
  adjacentRest,
  beatVisibility,
  chapterAt,
  isChapterId,
  restingChapter,
  restTarget,
  type ChapterId,
} from "@/lib/chapters";
import { scrollToY } from "@/lib/smooth-scroll";
import { useAppStore } from "@/lib/store";
import { createStoryState, evaluateStory } from "@/lib/story";

/** `damp-story` (Spesifikasi Lanjutan 1.1): scrollbar drags and jumps glide instead of cutting. */
const DAMP_STORY = 6;

interface Beat {
  element: HTMLElement;
  start: number;
  end: number;
  active: boolean;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !== null
  );
}

/**
 * Drives the Home story (Spesifikasi Lanjutan 9). Every frame it turns the
 * scroll position into damped story progress and hands it to:
 *
 * - the CSS, as `--p` on `#story` (beats fade around their rest poses),
 * - the scene, through the store (`scroll`, read in `useFrame`),
 * - the world layer, as `--story-invert` on `<html>`.
 *
 * It also steps PageDown / PageUp / Space between rest poses, lands chapter
 * links on their rest pose, scrolls a focused but hidden beat into view, and
 * keeps the URL hash on the chapter being read.
 *
 * Debug: `?progress=0.42` opens at that progress, `?freeze` stops time-based
 * motion, `?chapters` shows an overlay. Renders nothing.
 */
export function StoryDriver() {
  useEffect(() => {
    const root = document.getElementById("story");
    const html = document.documentElement;
    if (!root || !html.classList.contains("story")) return;

    const store = useAppStore.getState();
    const params = new URLSearchParams(window.location.search);
    useAppStore.setState({ frozen: params.has("freeze") });
    store.setStory(true);

    const geometry = { top: 0, range: 1 };
    const measure = () => {
      geometry.top = root.getBoundingClientRect().top + window.scrollY;
      geometry.range = Math.max(1, root.offsetHeight - window.innerHeight);
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);
    window.addEventListener("resize", measure);

    // Rounded up: scroll positions are whole pixels, and a jump to a rest pose
    // must land inside it, not a hair before.
    const scrollFor = (progress: number) => Math.ceil(geometry.top + progress * geometry.range);
    const rawProgress = () => clamp01((window.scrollY - geometry.top) / geometry.range);

    const beats: Beat[] = Array.from(root.querySelectorAll<HTMLElement>("[data-beat]"), (element) => ({
      element,
      start: Number.parseFloat(element.style.getPropertyValue("--beat-start")),
      end: Number.parseFloat(element.style.getPropertyValue("--beat-end")),
      active: false,
    }));

    // Where to open: ?progress first, then a chapter hash, else wherever the browser is.
    const requested = Number.parseFloat(params.get("progress") ?? "");
    const hash = window.location.hash.slice(1);
    const opening = Number.isFinite(requested)
      ? clamp01(requested)
      : isChapterId(hash)
        ? restTarget(hash)
        : null;
    if (opening !== null) scrollToY(scrollFor(opening), { immediate: true });

    const state = createStoryState();
    let damped = opening ?? rawProgress();
    let last = performance.now();
    let chapter: ChapterId | null = null;
    let restingIn: ChapterId | null = null;
    let inverted = false;
    let frame = 0;

    let overlay: HTMLPreElement | null = null;
    if (params.has("chapters")) {
      overlay = document.createElement("pre");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.cssText =
        "position:fixed;left:8px;bottom:8px;z-index:100;margin:0;padding:6px 8px;font:11px/1.4 var(--font-mono),monospace;background:rgb(0 0 0/.72);color:#fff;border-radius:4px;pointer-events:none;white-space:pre";
      document.body.append(overlay);
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!html.classList.contains("story")) return;

      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const raw = rawProgress();
      const previous = damped;
      damped += (raw - damped) * (1 - Math.exp(-DAMP_STORY * dt));
      if (Math.abs(raw - damped) < 1e-5) damped = raw;

      store.setScroll(damped, dt > 0 ? (damped - previous) / dt : 0);
      root.style.setProperty("--p", damped.toFixed(5));

      evaluateStory(damped, state);
      html.style.setProperty("--story-invert", state.invert.toFixed(3));
      // Hysteresis, so the nav does not flicker at the threshold.
      if (!inverted && state.invert > 0.55) {
        inverted = true;
        html.dataset.world = "inverse";
      } else if (inverted && state.invert < 0.45) {
        inverted = false;
        delete html.dataset.world;
      }

      const current = chapterAt(damped).id;
      if (current !== chapter) {
        chapter = current;
        store.setChapter(current);
      }

      for (const beat of beats) {
        const active = beatVisibility(damped, beat) > 0.5;
        if (active !== beat.active) {
          beat.active = active;
          beat.element.toggleAttribute("data-active", active);
        }
      }

      // Keep the URL on the chapter being read, without adding history entries.
      const resting = restingChapter(damped);
      if (resting && resting !== restingIn) {
        restingIn = resting;
        const url = resting === "apex" ? window.location.pathname + window.location.search : `#${resting}`;
        window.history.replaceState(window.history.state, "", url);
      }

      if (overlay) {
        overlay.textContent = `p ${damped.toFixed(4)}  raw ${raw.toFixed(4)}\n${current}${
          resting ? " · rest" : ""
        }  invert ${state.invert.toFixed(2)}  explode ${state.explode.toFixed(2)}`;
      }
    };
    frame = requestAnimationFrame(tick);

    // PageDown / PageUp / Space step between rest poses; Home / End go to the
    // first and the last one. Only while the story is on screen.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditable(event.target)) return;
      if (window.scrollY > scrollFor(1) + 1) return;
      const space = event.key === " ";
      if (space && event.target instanceof Element && event.target.closest("button, summary, [role='button']")) {
        return;
      }

      const raw = rawProgress();
      let next: number | null = null;
      if (event.key === "PageDown" || (space && !event.shiftKey)) next = adjacentRest(raw, 1)?.start ?? null;
      else if (event.key === "PageUp" || (space && event.shiftKey)) next = adjacentRest(raw, -1)?.start ?? null;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = restTarget("base");
      if (next === null) return;

      event.preventDefault();
      scrollToY(scrollFor(next));
    };
    window.addEventListener("keydown", onKeyDown);

    // Links to a chapter (#blocks, "Skip the story") land on its rest pose,
    // not on the top of its scroll range.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href, window.location.href);
      const id = url.hash.slice(1);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      if (!isChapterId(id)) return;

      event.preventDefault();
      event.stopPropagation();
      scrollToY(scrollFor(restTarget(id)));
      document.getElementById(id)?.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick, true);

    // Tab into a beat that is not showing: bring its rest pose on screen first.
    const onFocusIn = (event: FocusEvent) => {
      const element = event.target instanceof Element ? event.target.closest("[data-beat]") : null;
      const beat = beats.find((candidate) => candidate.element === element);
      if (!beat || beat.active) return;
      scrollToY(scrollFor(beat.start), { immediate: true });
    };
    root.addEventListener("focusin", onFocusIn);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick, true);
      root.removeEventListener("focusin", onFocusIn);
      overlay?.remove();
      html.style.removeProperty("--story-invert");
      delete html.dataset.world;
      const reset = useAppStore.getState();
      reset.setStory(false);
      reset.setChapter(null);
      reset.setScroll(0);
      useAppStore.setState({ frozen: false });
    };
  }, []);

  return null;
}
