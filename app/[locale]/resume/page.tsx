import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/dom/Button";
import { PageHeader } from "@/components/dom/PageHeader";
import { getExperiences, getSiteSettings, getSkills } from "@/lib/content";
import { formatLinkLabel, getCvLink, groupSkillsByBeam } from "@/lib/content-utils";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor } from "@/lib/seo";
import { BEAMS, type Experience } from "@/sanity/types";

type Props = PageProps<"/[locale]/resume">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });
  return {
    title: t("nav.resume"),
    description: t("resume.lead"),
    alternates: alternatesFor(locale, "/resume"),
  };
}

/**
 * Web version of the CV. Kept deliberately plain: real headings, lists and text
 * (no layout tables or text-in-images) so it prints cleanly and parses in an ATS.
 */
export default async function ResumePage({ params }: Props) {
  const locale = await resolveLocale(params);
  const [t, format, settings, experiences, skills] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getSiteSettings(locale),
    getExperiences(locale),
    getSkills(),
  ]);
  const cv = getCvLink(settings);
  const beams = groupSkillsByBeam(skills);

  const formatMonth = (value: string) =>
    format.dateTime(new Date(value), {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  const period = (item: Experience) => {
    if (!item.start) return null;
    return `${formatMonth(item.start)} – ${item.end ? formatMonth(item.end) : t("resume.present")}`;
  };

  const groups = [
    { id: "experience", title: t("resume.experience"), kinds: ["work"] },
    { id: "education", title: t("resume.education"), kinds: ["education"] },
    {
      id: "organizations",
      title: t("resume.organizations"),
      kinds: ["organization", "committee"],
    },
  ].map((group) => ({
    ...group,
    items: experiences.filter((item) => group.kinds.includes(item.kind)),
  }));

  return (
    <>
      <PageHeader title={t("nav.resume")} lead={t("resume.lead")}>
        {cv ? (
          <ButtonLink
            href={cv.href}
            download={cv.local}
            data-cv-link=""
            className="no-print"
          >
            {t("resume.download")}
          </ButtonLink>
        ) : (
          <p className="type-label text-muted no-print">{t("resume.pdfPending")}</p>
        )}
      </PageHeader>

      <div className="bg-surface pb-24">
        <div className="container-page flex max-w-[960px] flex-col gap-14">
          <section aria-labelledby="resume-identity">
            <h2 id="resume-identity" className="type-statement text-step-3">
              {settings.name}
            </h2>
            <p className="text-step-1 text-muted mt-1">{settings.role}</p>
            {settings.bioShort && (
              <p className="mt-4 max-w-[62ch]">{settings.bioShort}</p>
            )}
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
              {settings.socials.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    className="text-accent-text underline underline-offset-4"
                  >
                    {formatLinkLabel(social.url)}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`resume-${group.id}`}>
              <h2
                id={`resume-${group.id}`}
                className="type-label text-muted border-line mb-6 border-b pb-3"
              >
                {group.title}
              </h2>
              {group.items.length > 0 ? (
                <ul className="flex flex-col gap-8">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6">
                        <h3 className="text-step-1 font-sans font-semibold">
                          {item.position}
                        </h3>
                        {period(item) && (
                          <p className="type-label text-muted">{period(item)}</p>
                        )}
                      </div>
                      <p className="text-muted">{item.organization}</p>
                      {item.highlights.length > 0 && (
                        <ul className="mt-3 list-disc space-y-1 pl-5">
                          {item.highlights.map((highlight, index) => (
                            <li key={index}>{highlight}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">{t("resume.empty")}</p>
              )}
            </section>
          ))}

          <section aria-labelledby="resume-skills">
            <h2
              id="resume-skills"
              className="type-label text-muted border-line mb-6 border-b pb-3"
            >
              {t("resume.skills")}
            </h2>
            <dl className="flex flex-col gap-4">
              {BEAMS.map((beam) => (
                <div key={beam} className="grid-page gap-y-1">
                  <dt className="text-heading col-span-4 font-semibold md:col-span-2 lg:col-span-3">
                    {t(`spectrum.beam.${beam}`)}
                  </dt>
                  <dd className="col-span-4 lg:col-span-9">
                    {beams[beam].map((skill) => skill.name).join(", ")}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
