import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Project } from "@/sanity/types";
import { Tag } from "./Tag";

interface ProjectCardProps {
  project: Project;
  /** Localised category names, keyed by category id. */
  categoryLabels: Record<string, string>;
  stackLabel: string;
  cta: string;
  headingLevel?: 2 | 3;
  className?: string;
}

/**
 * Project card / block. The frame fills on hover (the Create with Swift tile
 * pattern). The title link is stretched over the whole card, so there is one
 * tab stop and one clear accessible name per project.
 */
export function ProjectCard({
  project,
  categoryLabels,
  stackLabel,
  cta,
  headingLevel = 3,
  className,
}: ProjectCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const number =
    project.number !== undefined ? String(project.number).padStart(2, "0") : null;

  return (
    <article
      className={cn(
        "group surface-alt border-line hover:border-line-strong ease-light relative flex h-full flex-col rounded-2xl border p-6 transition-[border-color,transform] duration-(--dur-s) hover:-translate-y-1 md:p-8",
        "focus-within:border-line-strong",
        className,
      )}
    >
      <p className="type-label text-muted flex items-center justify-between gap-4">
        {number && <span className="text-accent-text">{number}</span>}
        <span>
          {project.categories
            .map((category) => categoryLabels[category] ?? category)
            .join(" · ")}
        </span>
      </p>

      <Heading className="type-statement text-step-2 mt-8">
        <Link
          href={`/work/${project.slug}`}
          className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-orange-500"
        >
          {project.title}
        </Link>
      </Heading>

      {project.summary && (
        <p className="text-muted mt-4 text-pretty">{project.summary}</p>
      )}

      {project.stack.length > 0 && (
        <ul aria-label={stackLabel} className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <li key={item}>
              <Tag>{item}</Tag>
            </li>
          ))}
        </ul>
      )}

      <p
        aria-hidden="true"
        className="type-label text-accent-text mt-auto flex items-center gap-2 pt-8"
      >
        {cta}
        <span className="ease-light transition-transform duration-(--dur-s) group-hover:translate-x-1">
          →
        </span>
      </p>
    </article>
  );
}
