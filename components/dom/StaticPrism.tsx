import { useId } from "react";
import { cn } from "@/lib/utils";

const APEX = { x: 200, y: 62 };
const BASE_LEFT = { x: 58, y: 292 };
const BASE_FRONT = { x: 222, y: 338 };
const BASE_RIGHT = { x: 342, y: 286 };
const RAY_COUNT = 24;

/** Points spread along the two visible base edges, where the hairline rays land. */
const rayEnds = Array.from({ length: RAY_COUNT }, (_, index) => {
  const t = index / (RAY_COUNT - 1);
  const [from, to, local] =
    t < 0.56
      ? [BASE_LEFT, BASE_FRONT, t / 0.56]
      : [BASE_FRONT, BASE_RIGHT, (t - 0.56) / 0.44];
  return {
    x: from.x + (to.x - from.x) * local,
    y: from.y + (to.y - from.y) * local,
  };
});

/**
 * The pyramid as a static SVG: glass faces, hairline rays and the apex flare.
 *
 * This is what renders on the Low quality tier, without WebGL, without
 * JavaScript, and during the moment before the 3D scene has drawn its first
 * frame, so the hero is never an empty box. It is themed entirely through CSS
 * variables, which makes it follow Day/Night for free.
 */
export function StaticPrism({ className }: { className?: string }) {
  // Gradient ids must be unique per instance; the style tile renders two prisms.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `prism-${name}-${uid}`;
  const ref = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient
          id={id("face-left")}
          x1="200"
          y1="62"
          x2="110"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: "var(--ivory-50)", stopOpacity: 0.9 }} />
          <stop offset="1" style={{ stopColor: "var(--sage-300)", stopOpacity: 0.55 }} />
        </linearGradient>
        <linearGradient
          id={id("face-right")}
          x1="200"
          y1="62"
          x2="320"
          y2="320"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: "var(--sage-300)", stopOpacity: 0.5 }} />
          <stop offset="1" style={{ stopColor: "var(--green-700)", stopOpacity: 0.5 }} />
        </linearGradient>
        <radialGradient
          id={id("flare")}
          cx="200"
          cy="62"
          r="74"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: "var(--ivory-50)", stopOpacity: 1 }} />
          <stop
            offset="0.14"
            style={{ stopColor: "var(--orange-500)", stopOpacity: 0.95 }}
          />
          <stop
            offset="0.5"
            style={{ stopColor: "var(--orange-500)", stopOpacity: 0.18 }}
          />
          <stop offset="1" style={{ stopColor: "var(--orange-500)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient
          id={id("shadow")}
          cx="205"
          cy="336"
          r="170"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(0 302) scale(1 0.1)"
        >
          <stop offset="0" style={{ stopColor: "var(--green-900)", stopOpacity: 0.22 }} />
          <stop offset="1" style={{ stopColor: "var(--green-900)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      <ellipse cx="205" cy="336" rx="170" ry="17" fill={ref("shadow")} />

      <path
        d={`M${APEX.x} ${APEX.y} ${BASE_LEFT.x} ${BASE_LEFT.y} ${BASE_FRONT.x} ${BASE_FRONT.y}Z`}
        fill={ref("face-left")}
      />
      <path
        d={`M${APEX.x} ${APEX.y} ${BASE_FRONT.x} ${BASE_FRONT.y} ${BASE_RIGHT.x} ${BASE_RIGHT.y}Z`}
        fill={ref("face-right")}
      />

      <g style={{ stroke: "var(--line-strong)" }} strokeWidth="1" opacity="0.42">
        {rayEnds.map((end, index) => (
          <line
            key={index}
            x1={APEX.x}
            y1={APEX.y}
            x2={end.x.toFixed(1)}
            y2={end.y.toFixed(1)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      <path
        d={`M${APEX.x} ${APEX.y} ${BASE_LEFT.x} ${BASE_LEFT.y} ${BASE_FRONT.x} ${BASE_FRONT.y} ${BASE_RIGHT.x} ${BASE_RIGHT.y}Z M${APEX.x} ${APEX.y} ${BASE_FRONT.x} ${BASE_FRONT.y}`}
        style={{ stroke: "var(--line-strong)" }}
        strokeWidth="1.25"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      <circle cx={APEX.x} cy={APEX.y} r="74" fill={ref("flare")} />
    </svg>
  );
}
