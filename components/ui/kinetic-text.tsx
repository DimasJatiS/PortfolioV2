"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type KineticTag = "h1" | "h2" | "h3" | "p" | "span";

interface KineticTextProps {
  text: string;
  as?: KineticTag;
  className?: string;
  id?: string;
  /** What assistive technology reads instead of `text`, e.g. the full name. */
  label?: string;
}

/**
 * KineticText — adapted from Magic UI (`@magicui/kinetic-text`).
 *
 * Letters thicken around the cursor by animating Clash Display's weight axis
 * (200 → 600) through `font-variation-settings`. Changes from the original:
 * - no padding / text-stroke animation (the motion spec only allows cheap properties);
 * - words never break in the middle;
 * - touch devices get one sweep when the text enters the viewport;
 * - reduced motion renders a static weight of 300.
 * The styles live in `app/globals.css` (section 10).
 *
 * Screen readers get the intact string; the split letters are hidden from them.
 */
export function KineticText({
  text,
  as = "span",
  className,
  id,
  label,
}: KineticTextProps) {
  // Every allowed tag is a plain HTML element, so one element type covers the ref.
  const Tag = as as "span";
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    // Hover-capable devices are handled entirely in CSS.
    if (!window.matchMedia("(hover: none)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.dataset.swept = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");
  let letterIndex = 0;

  return (
    <Tag ref={ref} id={id} className={cn("kinetic", className)}>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <span key={`${word}-${wordIndex}`}>
            <span className="kinetic-word">
              {Array.from(word).map((letter) => {
                const index = letterIndex++;
                return (
                  <span
                    key={index}
                    className="kinetic-letter"
                    style={{ "--i": index } as CSSProperties}
                  >
                    {letter}
                  </span>
                );
              })}
            </span>
            {wordIndex < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
      <span className="sr-only">{label ?? text}</span>
    </Tag>
  );
}
