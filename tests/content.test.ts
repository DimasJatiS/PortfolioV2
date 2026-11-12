import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  formatLinkLabel,
  getCvLink,
  groupSkillsByBeam,
  readingMinutes,
  splitAccent,
} from "@/lib/content-utils";
import { evaluateLocally } from "@/sanity/lib/local";
import * as queries from "@/sanity/lib/queries";
import { seedDocuments } from "@/sanity/seed/data";
import {
  activitySchema,
  articleSchema,
  BEAMS,
  experienceSchema,
  labExperimentSchema,
  projectSchema,
  siteSettingsSchema,
  skillSchema,
} from "@/sanity/types";

/**
 * The GROQ queries are executed with groq-js against the seed dataset and the
 * results are validated with the same schemas the app uses. That proves three
 * things at once: the queries are valid GROQ, the seed content is complete, and
 * the fallback path the site runs on before Sanity is connected actually works.
 */
const run = (query: string, params: Record<string, unknown> = {}) =>
  evaluateLocally(query, params);

describe("seed dataset", () => {
  it("has unique document ids", () => {
    const ids = seedDocuments.map((doc) => doc._id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never contains a phone number (PRD 9.5)", () => {
    const text = JSON.stringify(seedDocuments);
    expect(text).not.toMatch(/\+62|\b08\d{8,}\b|wa\.me|tel:/i);
  });

  it("resolves every stack reference to a skill", () => {
    const ids = new Set(seedDocuments.map((doc) => doc._id));
    for (const doc of seedDocuments.filter(
      (candidate) => candidate._type === "project",
    )) {
      for (const reference of doc.stack as Array<{ _ref: string }>) {
        expect(ids.has(reference._ref), `${doc._id} → ${reference._ref}`).toBe(true);
      }
    }
  });
});

describe.each(["en", "id"] as const)("queries against seed content (%s)", (locale) => {
  it("siteSettings", async () => {
    const settings = siteSettingsSchema.parse(
      await run(queries.siteSettingsQuery, { locale }),
    );
    expect(settings.name).toBe("Dimas Jati Satria");
    expect(settings.role).toBe("Software Engineer");
    expect(settings.headline).toBe("LONG LIVE LEARNER");
    expect(settings.manifesto).toHaveLength(3);
    expect(settings.interests).toHaveLength(3);
    expect(settings.showAvailability).toBe(true);
    expect(settings.availability).toEqual({
      startMonth: "2027-02-01",
      minMonths: 4,
      mode: "both",
    });
    expect(settings.socials.map((social) => social.platform)).toEqual([
      "email",
      "linkedin",
      "github",
    ]);
    expect(settings.cvUrl).toBeUndefined();
  });

  it("projects: three featured first, six in total, stack resolved to names", async () => {
    const projects = z
      .array(projectSchema)
      .parse(await run(queries.projectsQuery, { locale }));
    expect(projects).toHaveLength(6);
    expect(projects.slice(0, 3).every((project) => project.featured)).toBe(true);
    expect(
      projects.filter((project) => project.featured).map((project) => project.slug),
    ).toEqual(["tbxxpert", "inofa", "ai-cv-screen"]);
    for (const project of projects) {
      expect(project.summary, project.slug).toBeTruthy();
      expect(project.stack.length, project.slug).toBeGreaterThan(0);
      expect(project.categories.length, project.slug).toBeGreaterThan(0);
      expect(project.liveUrl ?? project.repoUrl, project.slug).toBeTruthy();
    }
  });

  it("project by slug, and null for an unknown slug", async () => {
    const found = projectSchema
      .nullable()
      .parse(await run(queries.projectBySlugQuery, { locale, slug: "tbxxpert" }));
    expect(found?.title).toBe("TBXxpert");
    expect(found?.stack).toContain("Flutter");

    const missing = projectSchema
      .nullable()
      .parse(await run(queries.projectBySlugQuery, { locale, slug: "does-not-exist" }));
    expect(missing).toBeNull();
  });

  it("skills: every beam has entries; stack-only skills carry no beam", async () => {
    const skills = z.array(skillSchema).parse(await run(queries.skillsQuery));
    const groups = groupSkillsByBeam(skills);
    for (const beam of BEAMS) expect(groups[beam].length, beam).toBeGreaterThanOrEqual(5);
    expect(groups["frontend-creative"][0]?.name).toBe("React");
    expect(skills.find((skill) => skill.name === "MySQL")?.beam).toBeUndefined();
  });

  it("experience, activity, article and lab queries are valid and typed", async () => {
    const experiences = z
      .array(experienceSchema)
      .parse(await run(queries.experiencesQuery, { locale }));
    expect(experiences[0]?.organization).toBe("Universitas Gadjah Mada");

    expect(
      z.array(activitySchema).parse(await run(queries.activitiesQuery, { locale })),
    ).toEqual([]);
    expect(
      z.array(activitySchema).parse(await run(queries.recentActivitiesQuery, { locale })),
    ).toEqual([]);
    expect(
      z.array(articleSchema).parse(await run(queries.articlesQuery, { locale })),
    ).toEqual([]);
    expect(
      articleSchema
        .nullable()
        .parse(await run(queries.articleBySlugQuery, { locale, slug: "x" })),
    ).toBeNull();
    expect(
      z
        .array(labExperimentSchema)
        .parse(await run(queries.labExperimentsQuery, { locale })),
    ).toEqual([]);
  });
});

describe("locale fallback (content model: empty `id` falls back to `en`)", () => {
  it("uses the Indonesian value when present and English when it is missing", async () => {
    const en = siteSettingsSchema.parse(
      await run(queries.siteSettingsQuery, { locale: "en" }),
    );
    const id = siteSettingsSchema.parse(
      await run(queries.siteSettingsQuery, { locale: "id" }),
    );
    expect(id.manifesto[0]).not.toBe(en.manifesto[0]);
    expect(id.interests).toContain("Energi terbarukan");
    // seo.title has no Indonesian value in the seed data.
    expect(id.seoTitle).toBe(en.seoTitle);
  });
});

describe("schemas defend against bad CMS data", () => {
  it("drops unsafe URLs and unknown social platforms", () => {
    const settings = siteSettingsSchema.parse({
      name: "A",
      role: "B",
      headline: "C",
      cvUrl: "javascript:alert(1)",
      socials: [
        { platform: "github", url: "https://github.com/x" },
        { platform: "whatsapp", url: "https://wa.me/1" },
        { platform: "linkedin", url: "javascript:alert(1)" },
        null,
      ],
    });
    expect(settings.cvUrl).toBeUndefined();
    expect(settings.socials).toEqual([
      { platform: "github", url: "https://github.com/x" },
    ]);
    expect(settings.availability).toBeUndefined();
    expect(settings.manifesto).toEqual([]);
  });

  it("rejects a project without a usable slug", () => {
    expect(
      projectSchema.safeParse({ id: "p", title: "T", slug: "Not A Slug" }).success,
    ).toBe(false);
  });
});

describe("content helpers", () => {
  it("splitAccent marks *emphasised* words", () => {
    expect(splitAccent("turning curiosity into *crafted* products.")).toEqual([
      { text: "turning curiosity into ", accent: false },
      { text: "crafted", accent: true },
      { text: " products.", accent: false },
    ]);
    expect(splitAccent("no markers")).toEqual([{ text: "no markers", accent: false }]);
  });

  it("readingMinutes never returns less than one", () => {
    expect(readingMinutes(undefined)).toBe(1);
    expect(readingMinutes("word ".repeat(450))).toBe(3);
  });

  it("formatLinkLabel", () => {
    expect(formatLinkLabel("mailto:a@b.co")).toBe("a@b.co");
    expect(formatLinkLabel("https://www.github.com/DimasJatiS/")).toBe(
      "github.com/DimasJatiS",
    );
  });

  it("getCvLink forces a download name on the Sanity CDN and survives a bad URL", () => {
    const link = getCvLink({ cvUrl: "https://cdn.sanity.io/files/p/d/abc.pdf" });
    expect(link?.local).toBe(false);
    expect(link?.href).toContain("dl=Dimas-Jati-Satria-CV.pdf");
    expect(getCvLink({ cvUrl: undefined })).toBeNull();
  });
});
