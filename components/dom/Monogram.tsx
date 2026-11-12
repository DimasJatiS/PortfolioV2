import { cn } from "@/lib/utils";

/** DJS monogram: a pyramid with its apex light and three hairline rays. */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("size-7", className)}
    >
      <path
        d="M16 5 3.5 26.5h25L16 5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M16 5 10 26.5M16 5v21.5M16 5l6 21.5"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.55"
      />
      <circle cx="16" cy="5" r="2.25" fill="var(--orange-500)" />
    </svg>
  );
}
