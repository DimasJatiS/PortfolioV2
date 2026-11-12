import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dom/EmptyState";
import { PageHeader } from "@/components/dom/PageHeader";
import { Link } from "@/i18n/navigation";
import { getArticles } from "@/lib/content";
import { readingMinutes } from "@/lib/content-utils";
import { resolveLocale } from "@/lib/locale";
import { alternatesFor } from "@/lib/seo";

type Props = PageProps<"/[locale]/writing">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });
  return {
    title: t("nav.writing"),
    description: t("writing.lead"),
    alternates: alternatesFor(locale, "/writing"),
  };
}

export default async function WritingPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const [t, format, articles] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getArticles(locale),
  ]);

  return (
    <>
      <PageHeader title={t("nav.writing")} lead={t("writing.lead")} />

      <div className="bg-surface pb-24">
        <div className="container-page">
          {articles.length > 0 ? (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {articles.map((article) => (
                <li key={article.id}>
                  {/* Card pattern from Create with Swift: category, title, two-line summary, date, read time. */}
                  <article className="surface-alt border-line hover:border-line-strong relative flex h-full flex-col rounded-2xl border p-6 transition-colors duration-(--dur-s) md:p-8">
                    {article.category && (
                      <p className="type-label text-accent-text">{article.category}</p>
                    )}
                    <h2 className="type-statement text-step-2 mt-4">
                      <Link
                        href={`/writing/${article.slug}`}
                        className="after:absolute after:inset-0 after:rounded-2xl"
                      >
                        {article.title}
                      </Link>
                    </h2>
                    {article.excerpt && (
                      <p className="text-muted mt-4 line-clamp-2">{article.excerpt}</p>
                    )}
                    <p className="type-label text-muted mt-auto pt-8">
                      {article.publishedAt && (
                        <>
                          <time dateTime={article.publishedAt}>
                            {format.dateTime(new Date(article.publishedAt), {
                              dateStyle: "medium",
                              timeZone: "UTC",
                            })}
                          </time>{" "}
                          ·{" "}
                        </>
                      )}
                      {t("writing.readTime", { n: readingMinutes(article.plainBody) })}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t("writing.empty")}</EmptyState>
          )}
        </div>
      </div>
    </>
  );
}
