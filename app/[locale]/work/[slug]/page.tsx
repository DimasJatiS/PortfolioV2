import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/dom/Button";
import { TagList } from "@/components/dom/Tag";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProject, getProjects } from "@/lib/content";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor, jsonLdScript } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

type Props = PageProps<"/[locale]/work/[slug]">;

/** Used only when there are no projects at all, to keep the route buildable. */
const PLACEHOLDER_SLUG = "_";

export async function generateStaticParams() {
  const projects = await getProjects(routing.defaultLocale);
  const slugs = projects.map((project) => project.slug);
  // Cache Components requires at least one sample; the placeholder renders a 404.
  return (slugs.length > 0 ? slugs : [PLACEHOLDER_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const project = await getProject(locale, slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    alternates: alternatesFor(locale, `/work/${project.slug}`),
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const [t, project, projects] = await Promise.all([
    getTranslations(),
    getProject(locale, slug),
    getProjects(locale),
  ]);

  if (!project) notFound();

  const position = projects.findIndex((candidate) => candidate.slug === project.slug);
  const next =
    projects.length > 1 ? projects[(position + 1) % projects.length] : undefined;
  const number =
    project.number !== undefined ? String(project.number).padStart(2, "0") : null;

  const facts = [
    { label: t("case.role"), value: project.role },
    { label: t("case.duration"), value: project.duration },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: `${getSiteUrl()}${locale === routing.defaultLocale ? "" : `/${locale}`}/work/${project.slug}`,
    keywords: project.stack.join(", "),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />

      <header className="container-page pt-[calc(var(--nav-height)+3rem)] pb-12 md:pt-[calc(var(--nav-height)+6rem)]">
        <Link
          href="/work"
          className="type-label text-muted hover:text-heading inline-flex min-h-10 items-center gap-2"
        >
          <span aria-hidden="true">←</span> {t("case.back")}
        </Link>

        <p className="type-label text-muted mt-10 flex gap-3">
          {number && <span className="text-accent-text">{number}</span>}
          <span>
            {project.categories.map((category) => t(`category.${category}`)).join(" · ")}
          </span>
        </p>
        <h1 className="type-statement text-step-5 md:text-step-6 mt-4 max-w-[14ch]">
          {project.title}
        </h1>
        {project.summary && (
          <p className="text-muted text-step-1 mt-8 max-w-[52ch] leading-snug">
            {project.summary}
          </p>
        )}

        {(project.liveUrl || project.repoUrl) && (
          <div className="mt-10 flex flex-wrap gap-3">
            {project.liveUrl && (
              <ButtonLink href={project.liveUrl}>{t("work.live")} ↗</ButtonLink>
            )}
            {project.repoUrl && (
              <ButtonLink href={project.repoUrl} variant="secondary">
                {t("work.source")} ↗
              </ButtonLink>
            )}
          </div>
        )}
      </header>

      <div className="bg-surface pb-24">
        <div className="container-page">
          <div className="hairline" aria-hidden="true" />

          <dl className="grid-page gap-y-8 py-12">
            {facts.map((fact) => (
              <div key={fact.label} className="col-span-2 lg:col-span-3">
                <dt className="type-label text-muted">{fact.label}</dt>
                <dd className="text-heading mt-2 font-medium">{fact.value}</dd>
              </div>
            ))}
            {project.stack.length > 0 && (
              <div className="col-span-4 md:col-span-6">
                <dt className="type-label text-muted">{t("case.stack")}</dt>
                <dd className="mt-3">
                  <TagList items={project.stack} label={t("case.stack")} />
                </dd>
              </div>
            )}
          </dl>

          {!project.hasCaseStudy && (
            <p className="surface-alt border-line text-muted max-w-[60ch] rounded-2xl border px-6 py-5">
              {t("case.pending")}
            </p>
          )}

          {next && next.slug !== project.slug && (
            <nav aria-label={t("case.next")} className="border-line mt-20 border-t pt-10">
              <p className="type-label text-muted">{t("case.next")}</p>
              <Link
                href={`/work/${next.slug}`}
                className="type-statement text-step-3 text-heading decoration-accent mt-3 inline-block decoration-1 underline-offset-8 hover:underline"
              >
                {next.title} <span aria-hidden="true">→</span>
              </Link>
            </nav>
          )}
        </div>
      </div>
    </article>
  );
}
