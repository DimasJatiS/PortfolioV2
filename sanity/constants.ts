/**
 * Content vocabularies shared by the schemas, the UI and the webhook.
 *
 * Kept free of imports on purpose: client components use these lists, and
 * importing them must not pull the validation library into the browser bundle.
 */

export const FACES = [
  "frontend-creative",
  "backend-data",
  "mobile-ai",
  "design-collab",
] as const;
export type Face = (typeof FACES)[number];

export const PROJECT_CATEGORIES = ["web", "mobile", "ai", "creative"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const ACTIVITY_TYPES = [
  "event",
  "competition",
  "certification",
  "learning",
  "release",
  "organization",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const EXPERIENCE_KINDS = [
  "education",
  "work",
  "organization",
  "committee",
] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];

export const SOCIAL_PLATFORMS = ["email", "linkedin", "github"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const AVAILABILITY_MODES = ["onsite", "remote", "both"] as const;
export type AvailabilityMode = (typeof AVAILABILITY_MODES)[number];

/** Document types that carry a cache tag and can be revalidated by the webhook. */
export const CONTENT_TYPES = [
  "siteSettings",
  "project",
  "activity",
  "experience",
  "skill",
  "article",
  "labExperiment",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export function isContentType(value: unknown): value is ContentType {
  return (
    typeof value === "string" && (CONTENT_TYPES as readonly string[]).includes(value)
  );
}
