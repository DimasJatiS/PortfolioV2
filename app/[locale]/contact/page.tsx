import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AvailabilityBadge } from "@/components/dom/AvailabilityBadge";
import { ExternalLink } from "@/components/dom/ExternalLink";
import { PageHeader } from "@/components/dom/PageHeader";
import { Meteors } from "@/components/ui/meteors";
import { getAvailabilityLabel } from "@/lib/availability";
import { getSiteSettings } from "@/lib/content";
import { formatLinkLabel } from "@/lib/content-utils";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor } from "@/lib/seo";

type Props = PageProps<"/[locale]/contact">;

const PLATFORM_NAMES = {
  email: "Email",
  linkedin: "LinkedIn",
  github: "GitHub",
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });
  return {
    title: t("nav.contact"),
    description: t("contact.lead"),
    alternates: alternatesFor(locale, "/contact"),
  };
}

export default async function ContactPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const [t, settings] = await Promise.all([getTranslations(), getSiteSettings(locale)]);
  const availabilityLabel = await getAvailabilityLabel(settings);
  const email = settings.socials.find((social) => social.platform === "email");
  const elsewhere = settings.socials.filter((social) => social.platform !== "email");

  return (
    <>
      <PageHeader title={t("nav.contact")} lead={t("contact.lead")}>
        <AvailabilityBadge label={availabilityLabel} />
      </PageHeader>

      <div className="bg-surface relative overflow-hidden pb-24">
        <Meteors number={14} />
        <div className="container-page grid-page relative gap-y-14">
          {email && (
            <section
              aria-labelledby="contact-email"
              className="col-span-4 md:col-span-6 lg:col-span-7"
            >
              <h2 id="contact-email" className="type-label text-muted mb-4">
                {t("contact.email")}
              </h2>
              <a
                href={email.url}
                className="type-statement text-heading decoration-accent text-step-2 md:text-step-3 break-all underline decoration-1 underline-offset-8"
              >
                {formatLinkLabel(email.url)}
              </a>
              <p className="text-muted mt-8 max-w-[48ch]">{t("contact.formPending")}</p>
            </section>
          )}

          <section
            aria-labelledby="contact-elsewhere"
            className="col-span-4 md:col-span-6 lg:col-span-4 lg:col-start-9"
          >
            <h2 id="contact-elsewhere" className="type-label text-muted mb-4">
              {t("contact.elsewhere")}
            </h2>
            <ul className="flex flex-col gap-4">
              {elsewhere.map((social) => (
                <li key={social.platform} className="flex flex-col">
                  <span className="text-heading font-medium">
                    {PLATFORM_NAMES[social.platform]}
                  </span>
                  <ExternalLink
                    href={social.url}
                    newTabLabel={t("a11y.newTab")}
                    className="break-all"
                  >
                    {formatLinkLabel(social.url)}
                  </ExternalLink>
                </li>
              ))}
            </ul>
            <p className="type-label text-muted mt-10">{t("footer.timezone")}</p>
          </section>
        </div>
      </div>
    </>
  );
}
