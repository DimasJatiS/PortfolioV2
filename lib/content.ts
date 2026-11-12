import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import type { Locale } from "@/i18n/routing";
import { sanityClient } from "@/sanity/lib/client";
import { evaluateLocally } from "@/sanity/lib/local";
import {
  activitiesQuery,
  articleBySlugQuery,
  articlesQuery,
  experiencesQuery,
  labExperimentsQuery,
  projectBySlugQuery,
  projectsQuery,
  recentActivitiesQuery,
  siteSettingsQuery,
  skillsQuery,
} from "@/sanity/lib/queries";
import {
  activitySchema,
  articleSchema,
  experienceSchema,
  labExperimentSchema,
  projectSchema,
  siteSettingsSchema,
  skillSchema,
  type Activity,
  type Article,
  type Experience,
  type LabExperiment,
  type Project,
  type SiteSettings,
  type Skill,
} from "@/sanity/types";

/**
 * Content layer. Every page reads content through these functions and nothing
 * else, which gives one place for caching, validation and failure handling.
 *
 * Caching: each getter is a `use cache` function tagged with the document types
 * it reads. Publishing in Sanity calls /api/revalidate, which expires the tag,
 * so edits are live within a minute while pages stay static.
 *
 * Failure handling, in order:
 *   1. Sanity not configured     → seed content, cached indefinitely.
 *   2. Sanity request fails      → seed content, retried after a few minutes.
 *   3. Sanity returns bad data   → invalid list items are dropped; an invalid
 *                                  singleton falls back to seed content.
 * A page therefore never renders empty because of the CMS.
 */

const SANITY_TIMEOUT_MS = 8000;

/** Validate list items one by one so a single bad document cannot hide the rest. */
function listOf<S extends z.ZodType>(label: string, item: S) {
  return z
    .array(z.unknown())
    .nullish()
    .transform((items) =>
      (items ?? []).flatMap((entry) => {
        const parsed = item.safeParse(entry);
        if (parsed.success) return [parsed.data as z.output<S>];
        console.warn(
          `[content] ${label}: skipped a document with invalid fields.\n${z.prettifyError(parsed.error)}`,
        );
        return [];
      }),
    );
}

interface LoadOptions<S extends z.ZodType> {
  label: string;
  query: string;
  params: Record<string, unknown>;
  schema: S;
}

async function load<S extends z.ZodType>({
  label,
  query,
  params,
  schema,
}: LoadOptions<S>): Promise<z.output<S>> {
  if (sanityClient) {
    try {
      const raw: unknown = await sanityClient.fetch(query, params, {
        signal: AbortSignal.timeout(SANITY_TIMEOUT_MS),
      });
      const parsed = schema.safeParse(raw);
      if (parsed.success) {
        // The webhook expires the tag on publish; this is only the safety net.
        cacheLife("hours");
        return parsed.data;
      }
      console.error(
        `[content] ${label}: Sanity returned unexpected data, serving seed content.\n${z.prettifyError(parsed.error)}`,
      );
    } catch (error) {
      console.error(
        `[content] ${label}: Sanity request failed, serving seed content.`,
        error,
      );
    }
    // Do not pin the fallback: try Sanity again soon.
    cacheLife("minutes");
  } else {
    cacheLife("max");
  }

  // Seed content is covered by tests/content.test.ts, so a failure here is a
  // programming error and is allowed to reach the route's error boundary.
  return schema.parse(await evaluateLocally(query, params));
}

export async function getSiteSettings(locale: Locale): Promise<SiteSettings> {
  "use cache";
  cacheTag("siteSettings");
  return load({
    label: "siteSettings",
    query: siteSettingsQuery,
    params: { locale },
    schema: siteSettingsSchema,
  });
}

export async function getSkills(): Promise<Skill[]> {
  "use cache";
  cacheTag("skill");
  return load({
    label: "skills",
    query: skillsQuery,
    params: {},
    schema: listOf("skills", skillSchema),
  });
}

export async function getProjects(locale: Locale): Promise<Project[]> {
  "use cache";
  cacheTag("project", "skill");
  return load({
    label: "projects",
    query: projectsQuery,
    params: { locale },
    schema: listOf("projects", projectSchema),
  });
}

export async function getProject(locale: Locale, slug: string): Promise<Project | null> {
  "use cache";
  cacheTag("project", "skill");
  return load({
    label: `project "${slug}"`,
    query: projectBySlugQuery,
    params: { locale, slug },
    schema: projectSchema.nullable(),
  });
}

export async function getActivities(locale: Locale): Promise<Activity[]> {
  "use cache";
  cacheTag("activity");
  return load({
    label: "activities",
    query: activitiesQuery,
    params: { locale },
    schema: listOf("activities", activitySchema),
  });
}

export async function getRecentActivities(locale: Locale): Promise<Activity[]> {
  "use cache";
  cacheTag("activity");
  return load({
    label: "recent activities",
    query: recentActivitiesQuery,
    params: { locale },
    schema: listOf("recent activities", activitySchema),
  });
}

export async function getExperiences(locale: Locale): Promise<Experience[]> {
  "use cache";
  cacheTag("experience");
  return load({
    label: "experiences",
    query: experiencesQuery,
    params: { locale },
    schema: listOf("experiences", experienceSchema),
  });
}

export async function getArticles(locale: Locale): Promise<Article[]> {
  "use cache";
  cacheTag("article");
  return load({
    label: "articles",
    query: articlesQuery,
    params: { locale },
    schema: listOf("articles", articleSchema),
  });
}

export async function getArticle(locale: Locale, slug: string): Promise<Article | null> {
  "use cache";
  cacheTag("article");
  return load({
    label: `article "${slug}"`,
    query: articleBySlugQuery,
    params: { locale, slug },
    schema: articleSchema.nullable(),
  });
}

export async function getLabExperiments(locale: Locale): Promise<LabExperiment[]> {
  "use cache";
  cacheTag("labExperiment");
  return load({
    label: "lab experiments",
    query: labExperimentsQuery,
    params: { locale },
    schema: listOf("lab experiments", labExperimentSchema),
  });
}
