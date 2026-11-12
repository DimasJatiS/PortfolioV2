import { getFormatter, getTranslations } from "next-intl/server";
import type { SiteSettings } from "@/sanity/types";

/**
 * The small internship label (F-06), e.g.
 * "Available for internship · Feb 2027 · 4+ months · onsite or remote".
 *
 * Returns `null` when `showAvailability` is off or the data is incomplete, in
 * which case nothing is rendered. Every place that shows the label reserves its
 * own space, so switching the flag never shifts the layout.
 */
export async function getAvailabilityLabel(
  settings: Pick<SiteSettings, "showAvailability" | "availability">,
): Promise<string | null> {
  if (!settings.showAvailability || !settings.availability) return null;

  const { startMonth, minMonths, mode } = settings.availability;
  const start = new Date(startMonth);
  if (Number.isNaN(start.getTime())) return null;

  const [t, format] = await Promise.all([
    getTranslations("availability"),
    getFormatter(),
  ]);

  return t("label", {
    // Date-only values are UTC midnight; format in UTC so the month cannot slip.
    start: format.dateTime(start, { month: "short", year: "numeric", timeZone: "UTC" }),
    months: minMonths,
    mode: t(`mode.${mode}`),
  });
}
