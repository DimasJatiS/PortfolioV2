import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dom/EmptyState";
import { PageHeader } from "@/components/dom/PageHeader";
import { ProjectCard } from "@/components/dom/ProjectCard";
import { getProjects } from "@/lib/content";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor } from "@/lib/seo";
import { PROJECT_CATEGORIES, type Project } from "@/sanity/types";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/work">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });
  return {
    title: t("nav.work"),
    description: t("work.lead"),
    alternates: alternatesFor(locale, "/work"),
  };
}

export default async function WorkPage({ params }: PageProps<"/[locale]/work">) {
  const locale = await resolveLocale(params);
  const [t, projects] = await Promise.all([getTranslations(), getProjects(locale)]);

  const featured = projects.filter((project) => project.featured);
  const others = projects.filter((project) => !project.featured);
  const categoryLabels = Object.fromEntries(
    PROJECT_CATEGORIES.map((category) => [category, t(`category.${category}`)]),
  );

  const renderGrid = (items: Project[]) => (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((project) => (
        <li key={project.id}>
          <ProjectCard
            project={project}
            categoryLabels={categoryLabels}
            stackLabel={t("case.stack")}
            cta={t("blocks.cta")}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader title={t("nav.work")} lead={t("work.lead")} />

      <div className="bg-surface pb-24">
        <div className="container-page flex flex-col gap-16">
          {projects.length === 0 && <EmptyState>{t("work.empty")}</EmptyState>}

          {featured.length > 0 && (
            <section aria-labelledby="work-featured">
              <h2 id="work-featured" className="type-label text-muted mb-6">
                {t("work.featured")}
              </h2>
              {renderGrid(featured)}
            </section>
          )}

          {others.length > 0 && (
            <section aria-labelledby="work-more">
              <h2 id="work-more" className="type-label text-muted mb-6">
                {t("work.more")}
              </h2>
              {renderGrid(others)}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
