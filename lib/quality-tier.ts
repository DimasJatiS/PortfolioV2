/**
 * Adaptive quality (PRD 7.4). Maps the device to one of three render tiers and
 * describes what each tier is allowed to spend.
 */

export type QualityTier = "high" | "medium" | "low";

export interface QualitySettings {
  /** Device pixel ratio range handed to the R3F canvas. */
  dpr: [min: number, max: number];
  /** MeshTransmissionMaterial refraction samples. */
  transmissionSamples: number;
  /** Side length of the transmission render target, in pixels. */
  transmissionResolution: number;
  /** Render the back faces too (a second transmission pass). */
  backside: boolean;
  /** Number of hairline rays from apex to base. */
  rayCount: number;
  chromaticAberration: number;
}

export const QUALITY: Record<Exclude<QualityTier, "low">, QualitySettings> = {
  high: {
    dpr: [1, 2],
    transmissionSamples: 8,
    transmissionResolution: 1024,
    backside: true,
    rayCount: 40,
    chromaticAberration: 0.12,
  },
  medium: {
    dpr: [1, 1.5],
    transmissionSamples: 4,
    transmissionResolution: 512,
    backside: false,
    rayCount: 28,
    chromaticAberration: 0.08,
  },
};

/** The subset of `detect-gpu`'s result this module depends on. */
export interface GpuTierResult {
  tier: number;
  isMobile?: boolean;
  type?: string;
}

/**
 * - tier 0–1, or a blocklisted / software renderer → low (static fallback)
 * - tier 3 on desktop                              → high
 * - everything else (iGPU laptops, flagship phones) → medium
 */
export function tierFromGpu(result: GpuTierResult): QualityTier {
  if (result.type === "WEBGL_UNSUPPORTED" || result.type === "BLOCKLISTED") return "low";
  if (!Number.isFinite(result.tier) || result.tier <= 1) return "low";
  if (result.tier >= 3 && !result.isMobile) return "high";
  return "medium";
}

/** One step down, used when the frame rate cannot hold. */
export function lowerTier(tier: QualityTier): QualityTier {
  return tier === "high" ? "medium" : "low";
}

export function isWebGLAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return context !== null;
  } catch {
    return false;
  }
}

const DETECTION_TIMEOUT_MS = 2500;

/**
 * Classify the device. Never rejects: if the benchmark lookup fails or stalls,
 * the caller gets "medium", which renders the scene conservatively and lets the
 * runtime performance monitor take it from there.
 */
export async function detectQualityTier(): Promise<QualityTier> {
  if (!isWebGLAvailable()) return "low";

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<QualityTier>((resolve) => {
    timer = setTimeout(() => resolve("medium"), DETECTION_TIMEOUT_MS);
  });

  const detection = (async (): Promise<QualityTier> => {
    const { getGPUTier } = await import("detect-gpu");
    // Benchmarks are self-hosted (copied by scripts/prepare-assets.mjs) so the
    // lookup makes no third-party request.
    const result = await getGPUTier({ benchmarksURL: "/gpu-benchmarks" });
    return tierFromGpu(result);
  })().catch((error: unknown) => {
    console.warn("[quality] GPU detection failed, assuming a mid-range device.", error);
    return "medium" as const;
  });

  try {
    return await Promise.race([detection, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
