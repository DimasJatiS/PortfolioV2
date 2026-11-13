import { create } from "zustand";
import type { ChapterId } from "./chapters";
import type { QualityTier } from "./quality-tier";
import { lowerTier } from "./quality-tier";
import { STORAGE_KEYS } from "./site";
import { writeStorage } from "./storage";
import { themes, type Theme } from "./tokens";

/**
 * - `pending`     capability detection has not finished
 * - `ready`       WebGL works and the scene may render
 * - `unsupported` no WebGL context could be created
 * - `failed`      the scene threw, or the GPU context was lost
 */
export type WebGLStatus = "pending" | "ready" | "unsupported" | "failed";

interface AppState {
  theme: Theme;
  sound: boolean;
  /** `null` until detection finishes. */
  tier: QualityTier | null;
  webgl: WebGLStatus;
  reducedMotion: boolean;
  /** `true` once the first frame of the WebGL scene has been drawn. */
  sceneReady: boolean;

  /**
   * Per-frame values. The scene reads them with `useAppStore.getState()` inside
   * `useFrame`, so updating them never re-renders React.
   */
  scroll: number;
  scrollVelocity: number;
  pointer: { x: number; y: number };

  /**
   * `true` while the Home story drives the scene (Spesifikasi Lanjutan 9). Then
   * `scroll` is the damped story progress, 0–1.
   */
  story: boolean;
  /** Chapter in view; changes a handful of times per story, safe to subscribe to. */
  chapter: ChapterId | null;
  /** `?freeze`: stop every time-based motion, so a progress value is one exact frame. */
  frozen: boolean;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSound: (sound: boolean) => void;
  setTier: (tier: QualityTier) => void;
  degradeTier: () => void;
  setWebgl: (status: WebGLStatus) => void;
  setReducedMotion: (reduced: boolean) => void;
  setSceneReady: (ready: boolean) => void;
  setScroll: (progress: number, velocity?: number) => void;
  setPointer: (x: number, y: number) => void;
  setStory: (story: boolean) => void;
  setChapter: (chapter: ChapterId | null) => void;
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (themes as readonly string[]).includes(value);
}

function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const useAppStore = create<AppState>((set, get) => ({
  theme: "day",
  sound: false,
  tier: null,
  webgl: "pending",
  reducedMotion: false,
  sceneReady: false,
  scroll: 0,
  scrollVelocity: 0,
  pointer: { x: 0, y: 0 },
  story: false,
  chapter: null,
  frozen: false,

  setTheme: (theme) => {
    applyThemeToDocument(theme);
    writeStorage(STORAGE_KEYS.theme, theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === "day" ? "night" : "day"),
  setSound: (sound) => {
    writeStorage(STORAGE_KEYS.sound, sound ? "on" : "off");
    set({ sound });
  },
  setTier: (tier) => set({ tier }),
  degradeTier: () => {
    const { tier } = get();
    if (tier && tier !== "low") set({ tier: lowerTier(tier) });
  },
  setWebgl: (webgl) => set({ webgl }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setScroll: (progress, velocity = 0) =>
    set({ scroll: clamp01(progress), scrollVelocity: velocity }),
  setStory: (story) => set({ story }),
  setChapter: (chapter) => {
    if (get().chapter !== chapter) set({ chapter });
  },
  setPointer: (x, y) => {
    // Mutate in place: per-frame readers hold the same object, and no component
    // subscribes to pointer movement.
    const pointer = get().pointer;
    pointer.x = x;
    pointer.y = y;
  },
}));
