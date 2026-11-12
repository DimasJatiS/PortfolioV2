import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AA_LARGE_TEXT, AA_TEXT, contrastRatio, hexToRgb } from "@/lib/contrast";
import { duration, easeCss, stagger } from "@/lib/motion";
import {
  palette,
  primaryButton,
  surfaces,
  themes,
  type PaletteToken,
  type SurfaceName,
} from "@/lib/tokens";

const css = readFileSync(path.resolve(import.meta.dirname, "../app/globals.css"), "utf8");
const ratio = (fg: PaletteToken, bg: PaletteToken) =>
  contrastRatio(palette[fg], palette[bg]);

describe("contrast maths", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBe(1);
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
  });

  it("rejects anything that is not #RRGGBB", () => {
    expect(() => hexToRgb("#fff")).toThrow();
    expect(() => hexToRgb("rgb(0,0,0)")).toThrow();
  });
});

describe("text contrast, WCAG 2.2 AA (PRD 9.2)", () => {
  for (const theme of themes) {
    for (const surface of Object.keys(surfaces[theme]) as SurfaceName[]) {
      const tokens = surfaces[theme][surface];
      const where = `${theme} / ${surface} (${tokens.bg})`;

      it(`${where}: body, muted, heading and small accent text reach 4.5:1`, () => {
        for (const role of ["fg", "fgMuted", "heading", "accentText"] as const) {
          expect(
            ratio(tokens[role], tokens.bg),
            `${role} = ${tokens[role]}`,
          ).toBeGreaterThanOrEqual(AA_TEXT);
        }
      });
    }
  }

  it("orange-500 is large-text / non-text only: 3:1 on every base and inverse surface", () => {
    for (const theme of themes) {
      for (const surface of ["base", "inverse"] as const) {
        const tokens = surfaces[theme][surface];
        expect(
          ratio(tokens.accent, tokens.bg),
          `${theme}/${surface}`,
        ).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
      }
    }
  });

  it("documents the known limit: orange-500 on ivory-100 is below 3:1, so it is decoration only there", () => {
    expect(ratio("orange-500", "ivory-100")).toBeLessThan(AA_LARGE_TEXT);
    // The text accent used on that surface is the darker orange-800 instead.
    expect(surfaces.day.alt.accentText).toBe("orange-800");
  });

  it("primary button label is readable", () => {
    expect(ratio(primaryButton.fg, primaryButton.bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("explains why the derived tokens exist", () => {
    expect(ratio("orange-700", "ivory-100")).toBeLessThan(AA_TEXT);
    expect(ratio("orange-500", "green-900")).toBeLessThan(AA_TEXT);
    expect(ratio("ivory-50", "orange-500")).toBeLessThan(AA_TEXT);
  });
});

describe("CSS variables mirror the TypeScript tokens", () => {
  it.each(Object.entries(palette))("--%s is %s", (token, hex) => {
    expect(css).toMatch(new RegExp(`--${token}:\\s*${hex}\\s*;`, "i"));
  });

  it("motion tokens match", () => {
    expect(css).toContain(`--ease-light: ${easeCss.light};`);
    expect(css).toContain(`--ease-inout: ${easeCss.inout};`);
    for (const [name, value] of Object.entries(duration)) {
      expect(css).toContain(`--dur-${name}: ${value}ms;`);
    }
    expect(css).toContain(`--stagger-char: ${stagger.char}ms;`);
    expect(css).toContain(`--stagger-line: ${stagger.line}ms;`);
  });
});
