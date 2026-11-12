import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "id"],
  defaultLocale: "en",
  // English lives at `/`, Bahasa Indonesia at `/id` (PRD section 6).
  localePrefix: "as-needed",
  // `/` is always English. Recruiters land on a predictable, cacheable page and
  // switch with the EN/ID toggle; nothing redirects based on Accept-Language.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
