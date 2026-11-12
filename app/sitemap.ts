import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getArticles, getProjects } from "@/lib/content";
import { localizedPath } from "@/lib/seo";
import { getSiteUrl, NAV_ITEMS } from "@/lib/site";

/** Multi-language sitemap: one entry per page, with hreflang alternates (PRD 9.3). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [projects, articles] = await Promise.all([
    getProjects(routing.defaultLocale),
    getArticles(routing.defaultLocale),
  ]);

  const paths = [
    "/",
    ...NAV_ITEMS.map((item) => item.href),
    ...projects.map((project) => `/work/${project.slug}`),
    ...articles.map((article) => `/writing/${article.slug}`),
  ];

  const absolute = (locale: (typeof routing.locales)[number], path: string) =>
    `${base}${localizedPath(locale, path)}`.replace(/\/$/, "") || base;

  return paths.map((path) => ({
    url: absolute(routing.defaultLocale, path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, absolute(locale, path)]),
      ),
    },
  }));
}
