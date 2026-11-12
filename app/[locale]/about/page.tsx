import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { AvailabilityBadge } from "@/components/dom/AvailabilityBadge";
import { ButtonLink } from "@/components/dom/Button";
import { EmptyState } from "@/components/dom/EmptyState";
import { PageHeader } from "@/components/dom/PageHeader";
import { TagList } from "@/components/dom/Tag";
import { getAvailabilityLabel } from "@/lib/availability";
import { getActivities, getExperiences, getSiteSettings } from "@/lib/content";
import { getCvLink } from "@/lib/content-utils";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor } from "@/lib/seo";

type Props = PageProps<"/[locale]/about">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });
  return {
    title: t("nav.about"),
    description: t("about.lead"),
    alternates: alternatesFor(locale, "/about"),
  };
}

export default async function AboutPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const [t, format, settings, experiences, activities] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getSiteSettings(locale),
    getExperiences(locale),
    getActivities(locale),
  ]);
  const availabilityLabel = await getAvailabilityLabel(settings);
  const cv = getCvLink(settings);
  const education = experiences.filter((item) => item.kind === "education");

  return (
    <>
      <PageHeader title={t("nav.about")} lead={t("about.lead")}>
        <AvailabilityBadge label={availabilityLabel} />
      </PageHeader>

      <div className="bg-surface pb-24">
        <div className="container-page grid-page gap-y-16">
          <section
            aria-labelledby="about-story"
            className="col-span-4 md:col-span-6 lg:col-span-7"
          >
            <h2 id="about-story" className="type-label text-muted mb-6">
              {t("about.story")}
            </h2>
            <p className="text-step-1 leading-relaxed">
              {settings.bioLong ?? settings.bioShort}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/contact">{t("nav.contact")}</ButtonLink>
              <ButtonLink
                href={cv?.href ?? "/resume"}
                download={cv?.local}
                variant="secondary"
                data-cv-link=""
              >
                {cv ? t("hero.cta.cv") : t("hero.cta.resume")}
              </ButtonLink>
            </div>
          </section>

          <div className="col-span-4 flex flex-col gap-12 md:col-span-6 lg:col-span-4 lg:col-start-9">
            <section aria-labelledby="about-education">
              <h2 id="about-education" className="type-label text-muted mb-4">
                {t("about.education")}
              </h2>
              {education.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {education.map((item) => (
                    <li key={item.id}>
                      <p className="text-heading font-medium">{item.organization}</p>
                      <p className="text-muted">{item.position}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">{t("resume.empty")}</p>
              )}
            </section>

            <section aria-labelledby="about-interests">
              <h2 id="about-interests" className="type-label text-muted mb-4">
                {t("about.interests")}
              </h2>
              <TagList items={settings.interests} label={t("about.interests")} />
            </section>

            <section aria-labelledby="about-learning">
              <h2 id="about-learning" className="type-label text-muted mb-4">
                {t("about.learning")}
              </h2>
              {settings.currentlyLearning.length > 0 ? (
                <TagList items={settings.currentlyLearning} label={t("about.learning")} />
              ) : (
                <p className="text-muted">{t("about.learningEmpty")}</p>
              )}
            </section>
          </div>

          <section
            aria-labelledby="about-activities"
            className="col-span-4 md:col-span-6 lg:col-span-12"
          >
            <h2 id="about-activities" className="type-label text-muted mb-6">
              {t("about.activities")}
            </h2>
            {activities.length > 0 ? (
              <ul className="divide-line border-line divide-y border-y">
                {activities.map((activity) => (
                  <li key={activity.id} className="grid-page gap-y-1 py-5">
                    <p className="type-label text-muted col-span-4 md:col-span-2 lg:col-span-3">
                      <time dateTime={activity.date}>
                        {format.dateTime(new Date(activity.date), {
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </time>{" "}
                      · {t(`activityType.${activity.type}`)}
                    </p>
                    <div className="col-span-4 lg:col-span-9">
                      <p className="text-heading font-medium">{activity.title}</p>
                      {activity.description && (
                        <p className="text-muted mt-1">{activity.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>{t("about.activitiesEmpty")}</EmptyState>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
