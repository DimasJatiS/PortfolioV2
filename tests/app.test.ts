import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import id from "@/messages/id.json";
import { lowerTier, tierFromGpu } from "@/lib/quality-tier";
import { alternatesFor, jsonLdScript, localizedPath } from "@/lib/seo";

function keysOf(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? "").sort();
}

function flatten(value: unknown, prefix = ""): Array<[string, string]> {
  if (typeof value === "string") return [[prefix, value]];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("messages (EN + ID)", () => {
  it("have exactly the same keys", () => {
    expect(keysOf(id).sort()).toEqual(keysOf(en).sort());
  });

  it("have no empty strings", () => {
    for (const [key, value] of [...flatten(en), ...flatten(id)]) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("use the same placeholders in both languages", () => {
    const indonesian = new Map(flatten(id));
    for (const [key, value] of flatten(en)) {
      expect(placeholders(indonesian.get(key) ?? ""), key).toEqual(placeholders(value));
    }
  });
});

describe("quality tiers (PRD 7.4)", () => {
  it.each([
    [{ tier: 3, isMobile: false }, "high"],
    [{ tier: 3, isMobile: true }, "medium"],
    [{ tier: 2, isMobile: false }, "medium"],
    [{ tier: 1, isMobile: false }, "low"],
    [{ tier: 0, isMobile: true }, "low"],
    [{ tier: 3, type: "BLOCKLISTED" }, "low"],
    [{ tier: Number.NaN }, "low"],
  ] as const)("%o → %s", (result, expected) => {
    expect(tierFromGpu(result)).toBe(expected);
  });

  it("degrades one step at a time and stops at low", () => {
    expect(lowerTier("high")).toBe("medium");
    expect(lowerTier("medium")).toBe("low");
    expect(lowerTier("low")).toBe("low");
  });
});

describe("SEO helpers", () => {
  it("English lives at the root, Indonesian under /id", () => {
    expect(localizedPath("en", "/")).toBe("/");
    expect(localizedPath("id", "/")).toBe("/id");
    expect(localizedPath("en", "/work/inofa")).toBe("/work/inofa");
    expect(localizedPath("id", "/work/inofa")).toBe("/id/work/inofa");
  });

  it("builds canonical and hreflang alternates", () => {
    expect(alternatesFor("id", "/about")).toEqual({
      canonical: "/id/about",
      languages: { en: "/about", id: "/id/about", "x-default": "/about" },
    });
  });

  it("escapes < in JSON-LD", () => {
    expect(jsonLdScript({ name: "</script><script>" }).__html).not.toContain("<");
  });
});
