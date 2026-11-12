import { getTranslations } from "next-intl/server";
import { Meteors } from "@/components/ui/meteors";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSiteSettings } from "@/lib/content";
import { formatLinkLabel } from "@/lib/content-utils";
import { NAV_ITEMS } from "@/lib/site";
import { ExternalLink } from "./ExternalLink";
import { Monogram } from "./Monogram";

const PLATFORM_NAMES = {
  email: "Email",
  linkedin: "LinkedIn",
  github: "GitHub",
} as const;

export async function Footer({ locale }: { locale: Locale }) {
  const [t, settings] = await Promise.all([getTranslations(), getSiteSettings(locale)]);

  return (
    <footer className="surface-inverse no-print relative overflow-hidden">
      {/* Meteors read well on green-900 (Day). In Night this surface is ivory, so they are hidden. */}
      <div className="night:hidden">
        <Meteors number={14} />
      </div>

      <div className="container-page relative py-16 md:py-24">
        <p className="type-statement text-step-3 text-heading max-w-[20ch]">
          {t("footer.line")}
        </p>

        <div className="grid-page mt-14 gap-y-12">
          <nav
            aria-label={t("a11y.footerNav")}
            className="col-span-4 md:col-span-3 lg:col-span-4"
          >
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="type-label text-muted hover:text-heading inline-flex min-h-10 items-center transition-colors duration-(--dur-xs)"
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="col-span-4 flex flex-col gap-3 md:col-span-3 lg:col-span-5">
            {settings.socials.map((social) => (
              <li key={social.platform} className="flex flex-col">
                <span className="type-label text-muted">
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

          <div className="col-span-4 flex flex-col gap-4 md:col-span-6 lg:col-span-3 lg:items-end">
            <p className="type-label text-muted lg:text-right">{t("footer.timezone")}</p>
            <a
              href="#top"
              className="type-label text-heading decoration-accent inline-flex min-h-10 items-center gap-2 decoration-1 underline-offset-4 hover:underline"
            >
              <span aria-hidden="true">↑</span>
              {t("footer.top")}
            </a>
          </div>
        </div>

        <div className="hairline mt-14" aria-hidden="true" />
        <p className="text-muted type-label mt-6 flex items-center gap-3">
          <Monogram className="text-heading size-5" />
          {settings.name} · {settings.role}
        </p>
      </div>
    </footer>
  );
}
