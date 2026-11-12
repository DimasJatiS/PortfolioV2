import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once.
 *
 * Nothing here is required to run the site: without Sanity credentials the
 * content layer serves the bundled seed data. A malformed value is reported and
 * then treated as "not configured" so a typo cannot take the site down.
 */

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());

const schema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]*$/, "must contain only a-z, 0-9 and dashes")
      .optional(),
  ),
  NEXT_PUBLIC_SANITY_DATASET: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9_-]*$/, "must contain only a-z, 0-9, _ and dashes")
      .default("production"),
  ),
  SANITY_REVALIDATE_SECRET: optionalString,
});

function loadEnv(): z.infer<typeof schema> {
  const parsed = schema.safeParse({
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
  });

  if (parsed.success) return parsed.data;

  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  console.error(`[env] Invalid environment, falling back to seed content. ${problems}`);
  return { NEXT_PUBLIC_SANITY_DATASET: "production" };
}

export const env = loadEnv();

/** Pinned so a Sanity API change can never alter query results silently. */
export const SANITY_API_VERSION = "2026-11-01";

export interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
}

/** `null` when no project is configured, i.e. the site runs on seed content. */
export const sanityConfig: SanityConfig | null = env.NEXT_PUBLIC_SANITY_PROJECT_ID
  ? {
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
    }
  : null;
