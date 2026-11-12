import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  /** Position in a numbered sequence, e.g. 2 of 5 renders "02 / 05". */
  index?: number;
  total?: number;
  eyebrow?: string;
  title?: ReactNode;
  /** Heading level; sections directly under a page title use 2. */
  level?: 2 | 3;
  surface?: "base" | "alt" | "inverse";
  className?: string;
  children: ReactNode;
}

const surfaceClass = {
  base: "",
  alt: "surface-alt",
  inverse: "surface-inverse",
} as const;

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Page section with the numbered heading pattern (01 / 05), an optional
 * eyebrow, and the shared vertical rhythm. `aria-labelledby` ties the region to
 * its heading so it shows up as a named landmark.
 */
export function Section({
  id,
  index,
  total,
  eyebrow,
  title,
  level = 2,
  surface = "base",
  className,
  children,
}: SectionProps) {
  const Heading = level === 2 ? "h2" : "h3";
  const headingId = id && title ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "relative scroll-mt-(--nav-height) py-20 md:py-28",
        surfaceClass[surface],
        className,
      )}
    >
      <div className="container-page">
        {(title || eyebrow || index !== undefined) && (
          <header className="mb-10 md:mb-14">
            <p className="type-label text-muted flex items-center gap-3">
              {index !== undefined && (
                <span>
                  <span className="text-accent-text">{pad(index)}</span>
                  {total !== undefined && <span> / {pad(total)}</span>}
                </span>
              )}
              {eyebrow && <span>{eyebrow}</span>}
            </p>
            {title && (
              <Heading
                id={headingId}
                className="type-statement text-step-4 mt-4 max-w-[18ch]"
              >
                {title}
              </Heading>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
