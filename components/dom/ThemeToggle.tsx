"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { duration } from "@/lib/motion";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Day / Night switch. The icon is one SVG whose parts morph (the sun's rays
 * retract while a disc slides over it to form the moon), driven purely by the
 * `data-theme` attribute so it is correct before hydration.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("toggle");
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleClick = () => {
    // Ease DOM colours for the duration of the change only (see globals.css).
    const root = document.documentElement;
    root.classList.add("theme-transition");
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => root.classList.remove("theme-transition"),
      duration.m + 50,
    );
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={theme === "night"}
      aria-label={t("night")}
      title={t("night")}
      className={cn(
        "text-heading hover:bg-heading/10 inline-flex size-10 items-center justify-center rounded-full transition-colors duration-(--dur-xs)",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-5 overflow-visible"
      >
        <mask id="theme-toggle-mask">
          <rect width="24" height="24" fill="#fff" />
          <circle
            r="6"
            cy="8"
            fill="#000"
            className="ease-light night:translate-x-[16px] translate-x-[28px] transition-transform duration-(--dur-m)"
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r="5"
          fill="currentColor"
          mask="url(#theme-toggle-mask)"
          className="ease-light night:scale-[1.55] origin-center scale-100 transition-transform duration-(--dur-m)"
        />
        <g
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="ease-light night:scale-50 night:rotate-45 night:opacity-0 origin-center scale-100 rotate-0 opacity-100 transition-[transform,opacity] duration-(--dur-m)"
        >
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
        </g>
      </svg>
    </button>
  );
}
