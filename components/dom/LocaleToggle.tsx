"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * EN / ID switch. A real link to the same page in the other language, so it
 * works without JavaScript and search engines can follow it. `scroll={false}`
 * keeps the reading position (Spesifikasi Lanjutan, section 6).
 */
export function LocaleToggle({ className }: { className?: string }) {
  const t = useTranslations("a11y");
  const locale = useLocale();
  const pathname = usePathname();
  const other =
    routing.locales.find((candidate) => candidate !== locale) ?? routing.defaultLocale;

  return (
    <Link
      href={pathname}
      locale={other}
      hrefLang={other}
      scroll={false}
      className={cn(
        "type-label text-muted hover:bg-heading/10 inline-flex min-h-10 items-center gap-1 rounded-full px-3 transition-colors duration-(--dur-xs)",
        className,
      )}
    >
      {routing.locales.map((code, index) => (
        <span key={code} className="contents">
          {index > 0 && <span aria-hidden="true">/</span>}
          <span className={code === locale ? "text-heading font-semibold" : undefined}>
            {code.toUpperCase()}
          </span>
        </span>
      ))}
      <span className="sr-only" lang={other}>
        {" "}
        {t("switchLocale")}
      </span>
    </Link>
  );
}
