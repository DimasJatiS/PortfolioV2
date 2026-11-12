/** WCAG 2.x contrast maths, used by the style tile and the contrast test suite. */

const HEX = /^#?([0-9a-f]{6})$/i;

/** Parse `#RRGGBB` into 0–255 channels. Throws on anything else, by design. */
export function hexToRgb(hex: string): [number, number, number] {
  const match = HEX.exec(hex.trim());
  if (!match?.[1]) {
    throw new Error(`Expected a #RRGGBB colour, received "${hex}"`);
  }
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function channelToLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/** Contrast ratio between two colours, from 1 to 21. Order does not matter. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

export const AA_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;

export type ContrastGrade = "AAA" | "AA" | "AA large" | "fail";

export function gradeContrast(ratio: number): ContrastGrade {
  if (ratio >= 7) return "AAA";
  if (ratio >= AA_TEXT) return "AA";
  if (ratio >= AA_LARGE_TEXT) return "AA large";
  return "fail";
}
