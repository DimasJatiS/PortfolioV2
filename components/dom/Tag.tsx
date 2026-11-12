import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Skill / stack tag: a thin framed label in Geist Mono. */
export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "border-line text-fg inline-flex items-center rounded-full border px-3 py-1 font-mono text-[0.8125rem] leading-5",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TagList({
  items,
  label,
  className,
}: {
  items: readonly string[];
  label: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li key={item}>
          <Tag>{item}</Tag>
        </li>
      ))}
    </ul>
  );
}
