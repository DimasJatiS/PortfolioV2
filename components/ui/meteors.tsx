"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface MeteorsProps {
  /** 12–20 keeps it calm: light falling, not a meteor shower. */
  number?: number;
  /** Seconds. */
  minDuration?: number;
  maxDuration?: number;
  maxDelay?: number;
  /** Degrees. 200–215 lines the trails up with the pyramid's rays. */
  angle?: number;
  className?: string;
}

/** Small deterministic PRNG, so server and client render identical meteors. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Meteors — adapted from Magic UI (`@magicui/meteors`).
 *
 * Brand changes: orange head, sage tail fading to transparent. Behaviour
 * changes: positions are seeded instead of random-in-an-effect (no hydration
 * flash), the animation pauses while off screen, and nothing renders for
 * reduced motion or on the Low quality tier.
 *
 * The parent must be `relative` and `overflow-hidden`.
 */
export function Meteors({
  number = 16,
  minDuration = 4,
  maxDuration = 10,
  maxDelay = 6,
  angle = 208,
  className,
}: MeteorsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const tier = useAppStore((state) => state.tier);
  const disabled = reducedMotion || tier === "low";

  const meteors = useMemo(() => {
    const random = mulberry32(number * 7919 + Math.round(angle));
    return Array.from({ length: number }, () => ({
      left: `${(random() * 130).toFixed(2)}%`,
      delay: `${(random() * maxDelay).toFixed(2)}s`,
      duration: `${(minDuration + random() * (maxDuration - minDuration)).toFixed(2)}s`,
    }));
  }, [number, angle, minDuration, maxDuration, maxDelay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      container.style.setProperty("--meteor-state", visible ? "running" : "paused");
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [disabled]);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {meteors.map((meteor, index) => (
        <span
          key={index}
          className="animate-meteor absolute -top-[5%] size-0.5 rotate-(--angle) rounded-full bg-orange-500"
          style={
            {
              "--angle": `${-angle}deg`,
              left: meteor.left,
              animationDelay: meteor.delay,
              animationDuration: meteor.duration,
              animationPlayState: "var(--meteor-state, running)",
            } as CSSProperties
          }
        >
          <span className="from-sage-300 absolute top-1/2 -z-10 block h-px w-14 -translate-y-1/2 bg-linear-to-r to-transparent" />
        </span>
      ))}
    </div>
  );
}
