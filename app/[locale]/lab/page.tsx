import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dom/EmptyState";
import { ExternalLink } from "@/components/dom/ExternalLink";
import { PageHeader } from "@/components/dom/PageHeader";
import { getLabExperiments } from "@/lib/content";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor } from "@/lib/seo";

type Props = PageProps<"/[locale]/lab">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });
  return {
    title: t("nav.lab"),
    description: t("lab.title"),
    alternates: alternatesFor(locale, "/lab"),
  };
}

export default async function LabPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const [t, experiments] = await Promise.all([
    getTranslations(),
    getLabExperiments(locale),
  ]);

  return (
    <>
      <PageHeader title={t("nav.lab")} eyebrow={t("lab.title")} lead={t("lab.lead")} />

      <div className="bg-surface pb-24">
        <div className="container-page">
          {experiments.length > 0 ? (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {experiments.map((experiment) => (
                <li key={experiment.id}>
                  <article className="surface-alt border-line flex h-full flex-col rounded-2xl border p-6 md:p-8">
                    <h2 className="type-statement text-step-2">{experiment.title}</h2>
                    {experiment.description && (
                      <p className="text-muted mt-4">{experiment.description}</p>
                    )}
                    {experiment.credit && (
                      <p className="type-label text-muted mt-6">{experiment.credit}</p>
                    )}
                    {experiment.sourceUrl && (
                      <p className="mt-auto pt-8">
                        <ExternalLink
                          href={experiment.sourceUrl}
                          newTabLabel={t("a11y.newTab")}
                        >
                          {t("lab.source")}
                        </ExternalLink>
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t("lab.empty")}</EmptyState>
          )}
          <p className="type-label text-muted mt-10">{t("lab.credit")}</p>
        </div>
      </div>
    </>
  );
}
