import { z } from "zod";
import {
  ACTIVITY_TYPES,
  AVAILABILITY_MODES,
  BEAMS,
  EXPERIENCE_KINDS,
  PROJECT_CATEGORIES,
  SOCIAL_PLATFORMS,
} from "./constants";

export * from "./constants";

/**
 * Content shapes as the frontend consumes them: already resolved to one locale
 * by the GROQ projections in `sanity/lib/queries.ts`.
 *
 * Every query result is parsed with these schemas. Content is edited by hand in
 * Sanity, so a missing or malformed field is expected to happen eventually; the
 * schemas turn that into a logged fallback instead of a runtime crash deep in a
 * component.
 */

/** GROQ returns `null` for missing fields; the UI works with `undefined`. */
const optionalText = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const requiredText = z.string().trim().min(1);

const textList = z
  .array(z.string().nullish())
  .nullish()
  .transform((items) =>
    (items ?? []).filter((item): item is string => Boolean(item?.trim())),
  );

/** Only http(s) and mailto links may come out of the CMS. */
const safeUrl = z
  .string()
  .nullish()
  .transform((value) => {
    if (!value) return undefined;
    try {
      const url = new URL(value);
      return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : undefined;
    } catch {
      return undefined;
    }
  });

const isoDate = z
  .string()
  .nullish()
  .transform((value) =>
    value && !Number.isNaN(Date.parse(value)) ? value.slice(0, 10) : undefined,
  );

/* ----------------------------------------------------------------------------
   siteSettings
---------------------------------------------------------------------------- */

const availabilitySchema = z
  .object({
    startMonth: isoDate,
    minMonths: z.number().int().positive().nullish(),
    mode: z.enum(AVAILABILITY_MODES).nullish(),
  })
  .nullish()
  .transform((value) =>
    value?.startMonth && value.minMonths
      ? {
          startMonth: value.startMonth,
          minMonths: value.minMonths,
          mode: value.mode ?? ("both" as const),
        }
      : undefined,
  );

export const siteSettingsSchema = z.object({
  name: requiredText,
  role: requiredText,
  headline: requiredText,
  statement: optionalText,
  manifesto: textList,
  bioShort: optionalText,
  bioLong: optionalText,
  showAvailability: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
  availability: availabilitySchema,
  cvUrl: safeUrl,
  socials: z
    .array(z.object({ platform: z.string().nullish(), url: safeUrl }).nullish())
    .nullish()
    .transform((items) =>
      (items ?? []).flatMap((item) => {
        const platform = SOCIAL_PLATFORMS.find((known) => known === item?.platform);
        return platform && item?.url ? [{ platform, url: item.url }] : [];
      }),
    ),
  interests: textList,
  currentlyLearning: textList,
  seoTitle: optionalText,
  seoDescription: optionalText,
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

/* ----------------------------------------------------------------------------
   skill
---------------------------------------------------------------------------- */

export const skillSchema = z.object({
  id: requiredText,
  name: requiredText,
  /** Skills without a beam are stack tags only and stay out of the spectrum. */
  beam: z
    .string()
    .nullish()
    .transform((value) => BEAMS.find((beam) => beam === value)),
  order: z
    .number()
    .nullish()
    .transform((value) => value ?? 0),
});
export type Skill = z.infer<typeof skillSchema>;

/* ----------------------------------------------------------------------------
   project
---------------------------------------------------------------------------- */

export const projectSchema = z.object({
  id: requiredText,
  title: requiredText,
  slug: requiredText.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  number: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? undefined),
  featured: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
  categories: z
    .array(z.string().nullish())
    .nullish()
    .transform((items) =>
      PROJECT_CATEGORIES.filter((category) => (items ?? []).includes(category)),
    ),
  summary: optionalText,
  role: optionalText,
  duration: optionalText,
  stack: textList,
  liveUrl: safeUrl,
  repoUrl: safeUrl,
  publishedAt: isoDate,
  hasCaseStudy: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
});
export type Project = z.infer<typeof projectSchema>;

/* ----------------------------------------------------------------------------
   activity
---------------------------------------------------------------------------- */

export const activitySchema = z.object({
  id: requiredText,
  title: requiredText,
  type: z.enum(ACTIVITY_TYPES),
  date: requiredText.refine((value) => !Number.isNaN(Date.parse(value)), "invalid date"),
  description: optionalText,
  link: safeUrl,
});
export type Activity = z.infer<typeof activitySchema>;

/* ----------------------------------------------------------------------------
   experience
---------------------------------------------------------------------------- */

export const experienceSchema = z.object({
  id: requiredText,
  organization: requiredText,
  position: requiredText,
  kind: z.enum(EXPERIENCE_KINDS),
  start: isoDate,
  end: isoDate,
  highlights: textList,
});
export type Experience = z.infer<typeof experienceSchema>;

/* ----------------------------------------------------------------------------
   article
---------------------------------------------------------------------------- */

export const articleSchema = z.object({
  id: requiredText,
  title: requiredText,
  slug: requiredText.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: optionalText,
  category: optionalText,
  publishedAt: isoDate,
  /** Plain text of the body, used to compute reading time. */
  plainBody: optionalText,
});
export type Article = z.infer<typeof articleSchema>;

/* ----------------------------------------------------------------------------
   labExperiment
---------------------------------------------------------------------------- */

export const labExperimentSchema = z.object({
  id: requiredText,
  title: requiredText,
  slug: requiredText.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: optionalText,
  componentKey: requiredText,
  credit: optionalText,
  sourceUrl: safeUrl,
});
export type LabExperiment = z.infer<typeof labExperimentSchema>;
