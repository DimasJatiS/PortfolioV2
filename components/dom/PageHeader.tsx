import type { ReactNode } from "react";
import { KineticText } from "@/components/ui/kinetic-text";

interface PageHeaderProps {
  /** Rendered in wide-tracked capitals with the kinetic weight effect. */
  title: string;
  eyebrow?: string;
  lead?: ReactNode;
  children?: ReactNode;
}

/** Shared header of the editorial pages (Work, About, Lab, Writing, ...). */
export function PageHeader({ title, eyebrow, lead, children }: PageHeaderProps) {
  // The top padding keeps the title below the ambient pyramid, which sits in the
  // top-right corner under the nav (CanvasRoot / Scene) and is small on phones.
  return (
    <header className="container-page pt-[calc(var(--nav-height)+7rem)] pb-12 md:pb-16">
      {eyebrow && <p className="type-label text-muted mb-6">{eyebrow}</p>}
      <KineticText
        as="h1"
        text={title}
        className="type-designer text-heading text-step-4 md:text-step-5 block"
      />
      {lead && (
        <p className="text-muted text-step-1 mt-8 max-w-[46ch] leading-snug">{lead}</p>
      )}
      {children && <div className="mt-8">{children}</div>}
      <div className="hairline mt-12 md:mt-16" aria-hidden="true" />
    </header>
  );
}
