import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getArticle, getArticles } from "@/lib/content";
import { readingMinutes } from "@/lib/content-utils";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor } from "@/lib/seo";

type Props = PageProps<"/[locale]/writing/[slug]">;

/** There are no articles yet; the placeholder keeps the route buildable and renders a 404. */
const PLACEHOLDER_SLUG = "_";

export async function generateStaticParams() {
  const articles = await getArticles(routing.defaultLocale);
  const slugs = articles.map((article) => article.slug);
  return (slugs.length > 0 ? slugs : [PLACEHOLDER_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = await getArticle(locale, slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: alternatesFor(locale, `/writing/${article.slug}`),
  };
}

export default async function ArticlePage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const [t, format, article] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getArticle(locale, slug),
  ]);

  if (!article) notFound();

  return (
    <article>
      <header className="container-page max-w-[960px] pt-[calc(var(--nav-height)+3rem)] pb-12 md:pt-[calc(var(--nav-height)+6rem)]">
        <Link
          href="/writing"
          className="type-label text-muted hover:text-heading inline-flex min-h-10 items-center gap-2"
        >
          <span aria-hidden="true">←</span> {t("writing.back")}
        </Link>
        {article.category && (
          <p className="type-label text-accent-text mt-10">{article.category}</p>
        )}
        <h1 className="type-statement text-step-4 md:text-step-5 mt-4">
          {article.title}
        </h1>
        <p className="type-label text-muted mt-6">
          {article.publishedAt && (
            <>
              <time dateTime={article.publishedAt}>
                {format.dateTime(new Date(article.publishedAt), {
                  dateStyle: "long",
                  timeZone: "UTC",
                })}
              </time>{" "}
              ·{" "}
            </>
          )}
          {t("writing.readTime", { n: readingMinutes(article.plainBody) })}
        </p>
      </header>

      <div className="bg-surface pb-24">
        <div className="container-page max-w-[960px]">
          <div className="hairline mb-12" aria-hidden="true" />
          {article.excerpt && (
            <p className="text-step-1 leading-relaxed">{article.excerpt}</p>
          )}
          {/* The Portable Text body, table of contents and code blocks arrive in F3. */}
        </div>
      </div>
    </article>
  );
}
