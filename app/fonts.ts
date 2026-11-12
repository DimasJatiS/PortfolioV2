import localFont from "next/font/local";

/**
 * All four families are self-hosted Latin subsets (PRD 9.1, budget <= 160 KB;
 * current total is about 98 KB). Clash Display must be the variable build:
 * KineticText animates its weight axis from 200 to 600.
 *
 * `ClashDisplay-Variable.woff2` is not committed (see .gitignore); it is fetched
 * by `scripts/prepare-assets.mjs` before `dev` and `build`.
 */

export const clashDisplay = localFont({
  src: "./fonts/ClashDisplay-Variable.woff2",
  variable: "--font-clash",
  weight: "200 700",
  style: "normal",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const instrumentSerif = localFont({
  src: "./fonts/InstrumentSerif-Italic.woff2",
  variable: "--font-instrument",
  weight: "400",
  style: "italic",
  display: "swap",
  fallback: ["ui-serif", "Georgia", "serif"],
});

export const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist",
  weight: "100 900",
  style: "normal",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  style: "normal",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const fontVariables = [
  clashDisplay.variable,
  instrumentSerif.variable,
  geist.variable,
  geistMono.variable,
].join(" ");
