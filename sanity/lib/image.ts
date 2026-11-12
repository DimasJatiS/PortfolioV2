import "server-only";
import { createImageUrlBuilder, type ImageUrlBuilder } from "@sanity/image-url";
import { sanityConfig } from "@/lib/env";

type ImageSource = Parameters<ImageUrlBuilder["image"]>[0];

const builder = sanityConfig
  ? createImageUrlBuilder({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
    })
  : null;

/**
 * URL builder for a Sanity image, served from the Sanity CDN in a modern format.
 * Returns `null` when Sanity is not configured or the source is unusable, so
 * callers render their placeholder instead of a broken image.
 */
export function urlForImage(
  source: ImageSource | null | undefined,
): ImageUrlBuilder | null {
  if (!builder || !source) return null;
  try {
    return builder.image(source).auto("format").fit("max");
  } catch (error) {
    console.warn("[sanity] Could not build an image URL.", error);
    return null;
  }
}
