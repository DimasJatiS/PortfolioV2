import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { AvailabilityBadge } from "@/components/dom/AvailabilityBadge";
import { ButtonLink } from "@/components/dom/Button";
import { EmptyState } from "@/components/dom/EmptyState";
import { ExternalLink } from "@/components/dom/ExternalLink";
import { ProjectCard } from "@/components/dom/ProjectCard";
import { beatStyle, chapterSpan, StoryChapter } from "@/components/dom/StoryChapter";
import { StoryDriver } from "@/components/dom/StoryDriver";
import { TagList } from "@/components/dom/Tag";
import { KineticText } from "@/components/ui/kinetic-text";
import { Meteors } from "@/components/ui/meteors";
import { getAvailabilityLabel } from "@/lib/availability";
import { getChapter } from "@/lib/chapters";
import {
  getProjects,
  getRecentActivities,
  getSiteSettings,
  getSkills,
} from "@/lib/content";
import {
  formatLinkLabel,
  getCvLink,
  groupSkillsByFace,
  splitAccent,
} from "@/lib/content-utils";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor, jsonLdScript } from "@/lib/seo";
import { getSiteUrl, HOME_ACTS } from "@/lib/site";
import { FACES, PROJECT_CATEGORIES } from "@/sanity/types";

const TOTAL_ACTS = HOME_ACTS.length;

/** One brand-ramp colour per skill face (PRD section 4: no rainbow). */
const FACE_COLORS = [
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

const pad = (value: number) => String(value).padStart(2, "0");

function ActLabel({ index, label }: { index: number; label: string }) {
  return (
    <p className="type-label text-muted flex items-center gap-3">
      <span>
        <span className="text-accent-text">{pad(index)}</span> / {pad(TOTAL_ACTS)}
      </span>
      <span>{label}</span>
    </p>
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { alternates: alternatesFor(locale, "/") };
}

/**
 * Home: the Summit story in five chapters (PRD 4 and 7.2). The scene and the
 * scroll mechanics live in StoryDriver and the canvas; this page is the DOM
 * half, so every word stays real, indexable, accessible text.
 */
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
  const faces = groupSkillsByFace(skills);
  const categoryLabels = Object.fromEntries(
    PROJECT_CATEGORIES.map((category) => [category, t(`category.${category}`)]),
  );
  const statement = settings.statement ? splitAccent(settings.statement) : [];

  const apex = getChapter("apex");
  const ascent = getChapter("ascent");
  const facesChapter = getChapter("faces");
  const blocks = getChapter("blocks");
  const recently = getChapter("recently");
  const base = getChapter("base");

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
    <div id="story">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(personJsonLd)}
      />
      <StoryDriver />

      <a
        href="#blocks"
        className="type-label bg-surface text-heading sr-only rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-[calc(var(--nav-height)+0.75rem)] focus:left-4 focus:z-50"
      >
        {t("story.skip")}
      </a>

      {/* 01 — Apex. Transparent: the pyramid shows through. */}
      <StoryChapter id="apex" labelledBy="apex-title">
        <p className="sr-only">{t("a11y.sceneAlt")}</p>

        <div
          data-beat=""
          style={beatStyle(apex.rests[0]!)}
          className="container-page story:h-full story:min-h-0 flex min-h-dvh flex-col items-center justify-between gap-10 pt-[calc(var(--nav-height)+2.5rem)] pb-8 text-center"
        >
          <p className="type-label text-accent-text rise-in">{settings.headline}</p>

          <div className="flex flex-col items-center gap-4">
            <h1 id="apex-title" className="hero-name">
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
              <ButtonLink href="#blocks">{t("hero.cta.work")}</ButtonLink>
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
      </StoryChapter>

      {/* 02 — Ascent: inside the pyramid, looking up at the light. */}
      <StoryChapter id="ascent" labelledBy="ascent-title" panelClassName="overflow-hidden">
        <div className="night:hidden">
          <Meteors number={12} />
        </div>
        <div
          data-beat=""
          style={beatStyle(ascent.rests[0]!)}
          className="container-page story:h-full story:justify-center story:py-0 relative flex flex-col py-20 md:py-28"
        >
          <header className="mb-10 md:mb-14">
            <ActLabel index={2} label={t("acts.ascent")} />
            <h2 id="ascent-title" className="type-statement text-step-4 mt-4 max-w-[18ch]">
              {t("ascent.title")}
            </h2>
          </header>
          <div className="grid-page gap-y-10">
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
        </div>
      </StoryChapter>

      {/* 03 — Faces: the pyramid from above, one face per skill area. */}
      <StoryChapter id="faces" labelledBy="faces-title">
        <div className="container-page story:h-full story:justify-center story:py-[calc(var(--nav-height)+1.5rem)] flex flex-col gap-10 py-20 md:py-28">
          <header data-beat="" style={beatStyle(chapterSpan("faces"))}>
            <ActLabel index={3} label={t("acts.faces")} />
            <h2 id="faces-title" className="type-statement text-step-4 mt-4 max-w-[18ch]">
              {t("faces.title")}
            </h2>
          </header>
          <div className="story-stack story:max-w-sm story:sm:grid-cols-1 story:lg:grid-cols-1 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {FACES.map((face, index) => (
              <div key={face} data-beat="" style={beatStyle(facesChapter.rests[index]!)}>
                <div
                  aria-hidden="true"
                  className="mb-5 h-px w-full"
                  style={{ background: FACE_COLORS[index] }}
                />
                <h3 className="type-label text-heading mb-5">
                  {t(`faces.items.${face}`)}
                </h3>
                <TagList
                  items={faces[face].map((skill) => skill.name)}
                  label={t(`faces.items.${face}`)}
                />
              </div>
            ))}
          </div>
        </div>
      </StoryChapter>

      {/* 04 — Blocks: the pyramid flies apart; one featured project per block. */}
      <StoryChapter id="blocks" labelledBy="blocks-title">
        <div className="container-page story:h-full story:justify-between story:pt-[calc(var(--nav-height)+1.5rem)] story:pb-10 flex flex-col gap-10 py-20 md:py-28">
          <header
            data-beat=""
            style={beatStyle(chapterSpan("blocks"))}
            className="flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              <ActLabel index={4} label={t("acts.blocks")} />
              <h2 id="blocks-title" className="type-statement text-step-4 mt-4 max-w-[18ch]">
                {t("blocks.title")}
              </h2>
            </div>
            <ButtonLink href="/work" variant="ghost" size="sm" className="px-0">
              {t("blocks.all")} →
            </ButtonLink>
          </header>

          {featured.length > 0 ? (
            <ul className="story-stack story:max-w-md story:lg:grid-cols-1 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {featured.map((project, index) => (
                <li key={project.id} data-beat="" style={beatStyle(blocks.rests[index]!)}>
                  <ProjectCard
                    project={project}
                    categoryLabels={categoryLabels}
                    stackLabel={t("case.stack")}
                    cta={t("blocks.cta")}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div data-beat="" style={beatStyle(chapterSpan("blocks"))}>
              <EmptyState>{t("work.empty")}</EmptyState>
            </div>
          )}
        </div>
      </StoryChapter>

      {/* Recently: back in the light, between the blocks and the base. */}
      <StoryChapter id="recently" labelledBy="recently-title">
        <div
          data-beat=""
          style={beatStyle(recently.rests[0]!)}
          className="container-page story:h-full story:justify-center story:py-0 flex flex-col py-16"
        >
          <h2 id="recently-title" className="type-label text-muted mb-6">
            {t("recently.title")}
          </h2>
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
      </StoryChapter>

      {/* 05 — Base: the blocks settle, the light gathers in the halo. */}
      <StoryChapter
        id="base"
        labelledBy="base-title"
        className="surface-alt"
        panelClassName="overflow-hidden"
      >
        <Meteors number={16} />
        <div
          data-beat=""
          style={beatStyle(base.rests[0]!)}
          className="container-page story:h-full story:justify-center story:py-0 relative flex flex-col items-center gap-8 py-24 text-center md:py-36"
        >
          <p className="type-label text-muted">
            <span className="text-accent-text">05</span> / 05 · {t("acts.base")}
          </p>
          <KineticText
            as="h2"
            id="base-title"
            text={t("base.title")}
            className="type-designer text-heading text-step-3 md:text-step-5 block max-w-[16ch]"
          />
          <p className="text-muted text-step-1">{t("base.sub")}</p>
          <ButtonLink href="/contact">{t("base.cta")}</ButtonLink>
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
      </StoryChapter>
    </div>
  );
}
