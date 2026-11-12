/**
 * Studio configuration from `studio/.env`. Sanity exposes variables prefixed
 * with SANITY_STUDIO_ to both the CLI and the browser bundle.
 */
export const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "";
export const dataset = process.env.SANITY_STUDIO_DATASET || "production";
export const studioHost = process.env.SANITY_STUDIO_HOSTNAME || undefined;

export function assertConfigured(): void {
  if (!projectId) {
    throw new Error(
      "SANITY_STUDIO_PROJECT_ID is missing. Copy studio/.env.example to studio/.env and set your project id (sanity.io/manage).",
    );
  }
}
