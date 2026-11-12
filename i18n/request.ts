import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { TIME_ZONE } from "@/lib/site";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  // An explicit locale is passed by `generateMetadata`; everywhere else the
  // `[locale]` root parameter is the source of truth, which keeps pages static.
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  return {
    locale: resolved,
    timeZone: TIME_ZONE,
    messages: (await import(`../messages/${resolved}.json`)).default,
    onError(error) {
      // A missing translation must never take a page down; log it and fall back.
      console.error(`[i18n] ${error.code}: ${error.message}`);
    },
    getMessageFallback({ namespace, key }) {
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});
