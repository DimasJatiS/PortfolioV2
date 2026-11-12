import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  /** Announced after the link text, e.g. "opens in a new tab". */
  newTabLabel: string;
  className?: string;
}

/** Text link to another site. `mailto:` links stay in the same tab. */
export function ExternalLink({
  href,
  children,
  newTabLabel,
  className,
}: ExternalLinkProps) {
  const newTab = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={cn(
        "text-accent-text decoration-accent/50 hover:decoration-accent underline decoration-1 underline-offset-4 transition-colors duration-(--dur-xs)",
        className,
      )}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {newTab && (
        <>
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> ({newTabLabel})</span>
        </>
      )}
    </a>
  );
}
