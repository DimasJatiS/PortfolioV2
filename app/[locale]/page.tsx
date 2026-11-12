import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { AvailabilityBadge } from "@/components/dom/AvailabilityBadge";
import { ButtonLink } from "@/components/dom/Button";
import { EmptyState } from "@/components/dom/EmptyState";
import { ExternalLink } from "@/components/dom/ExternalLink";
import { ProjectCard } from "@/components/dom/ProjectCard";
import { Section } from "@/components/dom/Section";
import { TagList } from "@/components/dom/Tag";
import { KineticText } from "@/components/ui/kinetic-text";
import { Meteors } from "@/components/ui/meteors";
import { getAvailabilityLabel } from "@/lib/availability";
import {
  getProjects,
  getRecentActivities,
  getSiteSettings,
  getSkills,
} from "@/lib/content";
import {
  formatLinkLabel,
  getCvLink,
  groupSkillsByBeam,
  splitAccent,
} from "@/lib/content-utils";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor, jsonLdScript } from "@/lib/seo";
import { getSiteUrl, HOME_ACTS } from "@/lib/site";
import { BEAMS, PROJECT_CATEGORIES } from "@/sanity/types";

const TOTAL_ACTS = HOME_ACTS.length;

/** One brand-spectrum colour per skill beam (PRD section 4: no rainbow). */
const BEAM_COLORS = [
  "var(--sage-300)",
  "var(--green-700)",
  "var(--amber-400)",
  "var(--orange-500)",
];

const PLATFORM_NAMES = {
  email: "Email",
  linkedin: "LinkedIn",
  github: "GitHub",
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { alternates: alternatesFor(locale, "/") };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const [t, format, settings, projects, skills, recent] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getSiteSettings(locale),
    getProjects(locale),
    getSkills(),
    getRecentActivities(locale),
  ]);

  const availabilityLabel = await getAvailabilityLabel(settings);
  const cv = getCvLink(settings);
  const featured = projects.filter((project) => project.featured).slice(0, 3);
  const beams = groupSkillsByBeam(skills);
  const categoryLabels = Object.fromEntries(
    PROJECT_CATEGORIES.map((category) => [category, t(`category.${category}`)]),
  );
  const statement = settings.statement ? splitAccent(settings.statement) : [];

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.name,
    jobTitle: settings.role,
    url: getSiteUrl(),
    description: settings.bioShort,
    sameAs: settings.socials
      .filter((social) => social.platform !== "email")
      .map((social) => social.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(personJsonLd)}
      />

      {/* 01 — Incidence. The hero is transparent: the pyramid shows through it. */}
      <section
        id="incidence"
        aria-labelledby="incidence-title"
        className="relative flex min-h-dvh flex-col"
      >
        <p className="sr-only">{t("a11y.sceneAlt")}</p>

        <div className="container-page flex flex-1 flex-col items-center justify-between gap-10 pt-[calc(var(--nav-height)+2.5rem)] pb-8 text-center">
          <p className="type-label text-accent-text rise-in">{settings.headline}</p>

          <div className="flex flex-col items-center gap-4">
            <h1 id="incidence-title" className="hero-name">
              <KineticText
                text={t("hero.name")}
                label={`${settings.name} — ${settings.role}`}
                className="type-designer text-heading block text-[clamp(1.5rem,6.2vw,5rem)]"
              />
            </h1>
            <p
              aria-hidden="true"
              className="type-label text-fg rise-in"
              style={{ "--order": 2 } as CSSProperties}
            >
              {settings.role}
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            {statement.length > 0 && (
              <p
                className="type-statement text-heading text-step-2 rise-in max-w-[22ch] text-balance"
                style={{ "--order": 3 } as CSSProperties}
              >
                {statement.map((segment, index) =>
                  segment.accent ? (
                    <em key={index} className="type-accent text-accent-text">
                      {segment.text}
                    </em>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </p>
            )}

            <AvailabilityBadge label={availabilityLabel} className="justify-center" />

            <div className="flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="#shards">{t("hero.cta.work")}</ButtonLink>
              <ButtonLink
                href={cv?.href ?? "/resume"}
                download={cv?.local}
                variant="secondary"
                data-cv-link=""
              >
                {cv ? t("hero.cta.cv") : t("hero.cta.resume")}
              </ButtonLink>
            </div>

            <p
              aria-hidden="true"
              className="type-label text-muted animate-pulse-soft mt-2"
            >
              {t("hero.scroll")} ↓
            </p>
          </div>
        </div>
      </section>

      {/* 02 — Refraction */}
      <Section
        id="refraction"
        index={2}
        total={TOTAL_ACTS}
        eyebrow={t("acts.refraction")}
        title={t("refraction.title")}
        surface="inverse"
        className="overflow-hidden"
      >
        <div className="night:hidden">
          <Meteors number={12} />
        </div>
        <div className="grid-page relative gap-y-10">
          <ol className="col-span-4 flex flex-col gap-6 md:col-span-6 lg:col-span-8">
            {settings.manifesto.map((line, index) => (
              <li
                key={index}
                className="text-step-2 font-display leading-tight font-light"
              >
                {line}
              </li>
            ))}
          </ol>
          {settings.bioShort && (
            <p className="text-muted col-span-4 md:col-span-6 lg:col-span-4 lg:pt-2">
              {settings.bioShort}
            </p>
          )}
        </div>
      </Section>

      {/* 03 — Dispersion */}
      <Section
        id="dispersion"
        index={3}
        total={TOTAL_ACTS}
        eyebrow={t("acts.dispersion")}
        title={t("spectrum.title")}
        className="bg-surface"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {BEAMS.map((beam, index) => (
            <div key={beam}>
              <div
                aria-hidden="true"
                className="mb-5 h-px w-full"
                style={{ background: BEAM_COLORS[index] }}
              />
              <h3 className="type-label text-heading mb-5">
                {t(`spectrum.beam.${beam}`)}
              </h3>
              <TagList
                items={beams[beam].map((skill) => skill.name)}
                label={t(`spectrum.beam.${beam}`)}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* 04 — Shards, followed by the "Recently" strip */}
      <Section
        id="shards"
        index={4}
        total={TOTAL_ACTS}
        eyebrow={t("acts.shards")}
        title={t("shards.title")}
        className="bg-surface"
      >
        {featured.length > 0 ? (
          <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {featured.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  categoryLabels={categoryLabels}
                  stackLabel={t("case.stack")}
                  cta={t("shards.cta")}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>{t("work.empty")}</EmptyState>
        )}

        <p className="mt-10">
          <ButtonLink href="/work" variant="ghost" size="sm" className="px-0">
            {t("shards.all")} →
          </ButtonLink>
        </p>

        <div className="mt-20" aria-labelledby="recently-title" role="region">
          <h3 id="recently-title" className="type-label text-muted mb-6">
            {t("recently.title")}
          </h3>
          {recent.length > 0 ? (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {recent.map((activity) => (
                <li key={activity.id} className="border-line border-t pt-5">
                  <p className="type-label text-muted">
                    {t(`activityType.${activity.type}`)} ·{" "}
                    <time dateTime={activity.date}>
                      {format.dateTime(new Date(activity.date), {
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                  </p>
                  <p className="text-heading mt-2 font-medium">{activity.title}</p>
                  {activity.description && (
                    <p className="text-muted mt-1 text-[0.9375rem]">
                      {activity.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t("recently.empty")}</EmptyState>
          )}
        </div>
      </Section>

      {/* 05 — Convergence */}
      <section
        id="convergence"
        aria-labelledby="convergence-title"
        className="surface-alt relative scroll-mt-(--nav-height) overflow-hidden py-24 md:py-36"
      >
        <Meteors number={16} />
        <div className="container-page relative flex flex-col items-center gap-8 text-center">
          <p className="type-label text-muted">
            <span className="text-accent-text">05</span> / 05 · {t("acts.convergence")}
          </p>
          <KineticText
            as="h2"
            id="convergence-title"
            text={t("convergence.title")}
            className="type-designer text-heading text-step-3 md:text-step-5 block max-w-[16ch]"
          />
          <p className="text-muted text-step-1">{t("convergence.sub")}</p>
          <ButtonLink href="/contact">{t("convergence.cta")}</ButtonLink>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {settings.socials.map((social) => (
              <li key={social.platform}>
                <ExternalLink href={social.url} newTabLabel={t("a11y.newTab")}>
                  <span className="sr-only">{PLATFORM_NAMES[social.platform]}: </span>
                  {formatLinkLabel(social.url)}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
