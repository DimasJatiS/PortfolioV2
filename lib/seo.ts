import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

/** Public path of a page in a locale: English at `/`, Indonesian under `/id`. */
export function localizedPath(locale: Locale, pathname: string): string {
  const path = pathname === "/" ? "" : pathname;
  return locale === routing.defaultLocale ? path || "/" : `/${locale}${path}`;
}

/**
 * Canonical URL plus `hreflang` alternates for a page (PRD 9.3). Paths are
 * relative; `metadataBase` in the root layout makes them absolute.
 */
export function alternatesFor(locale: Locale, pathname: string): Metadata["alternates"] {
  return {
    canonical: localizedPath(locale, pathname),
    languages: {
      ...Object.fromEntries(
        routing.locales.map((code) => [code, localizedPath(code, pathname)]),
      ),
      "x-default": localizedPath(routing.defaultLocale, pathname),
    },
  };
}

/** Serialise JSON-LD safely for an inline <script> (escapes `<`). */
export function jsonLdScript(data: Record<string, unknown>): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
