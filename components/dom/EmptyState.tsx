import type { ReactNode } from "react";

/** Shown when a content list has no entries yet, so a page is never just blank. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="border-line text-muted type-label rounded-2xl border border-dashed px-6 py-10 text-center">
      {children}
    </p>
  );
}
