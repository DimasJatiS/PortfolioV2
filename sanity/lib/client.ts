import "server-only";
import { createClient, type SanityClient } from "next-sanity";
import { sanityConfig } from "@/lib/env";

/**
 * Read-only Sanity client. `server-only` keeps it (and the Sanity SDK) out of
 * the browser bundle: every fetch happens in a Server Component.
 *
 * `null` means no project is configured and the site runs on seed content.
 */
export const sanityClient: SanityClient | null = sanityConfig
  ? createClient({
      ...sanityConfig,
      // Published content through the CDN; freshness comes from tag revalidation.
      useCdn: true,
      perspective: "published",
      stega: false,
    })
  : null;

export const isSanityConfigured = sanityClient !== null;
