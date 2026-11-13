import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { CanvasRoot } from "@/components/canvas/CanvasRoot";
import { AppEffects } from "@/components/dom/AppEffects";
import { Footer } from "@/components/dom/Footer";
import { Nav } from "@/components/dom/Nav";
import { SkipLink } from "@/components/dom/SkipLink";
import { SmoothScroll } from "@/components/dom/SmoothScroll";
import { ThemeScript } from "@/components/dom/ThemeScript";
import { routing } from "@/i18n/routing";
import { getAvailabilityLabel } from "@/lib/availability";
import { getSiteSettings } from "@/lib/content";
import { getCvLink } from "@/lib/content-utils";
import { resolveLocale } from "@/lib/locale";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import { palette } from "@/lib/tokens";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * The whole site is static output. Every page is prerendered from cached
 * content, and the build fails if a route starts depending on request data.
 * It also means an unknown slug waits for its render and returns a real 404
 * status, instead of a 200 shell that streams a not-found message.
 */
export const ensureStatic = "navigation";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: palette["ivory-50"] },
    { media: "(prefers-color-scheme: dark)", color: palette["green-950"] },
  ],
};

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: "meta" }),
    getSiteSettings(locale),
  ]);
  const title = settings.seoTitle ?? t("title");
  const description = settings.seoDescription ?? t("description");

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: t("titleTemplate") },
    description,
    applicationName: SITE_NAME,
    authors: [{ name: settings.name }],
    creator: settings.name,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      locale: locale === "id" ? "id_ID" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    // A phone number is never published; stop browsers from inventing tel: links.
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const [t, settings] = await Promise.all([
    getTranslations("a11y"),
    getSiteSettings(locale),
  ]);
  const availabilityLabel = await getAvailabilityLabel(settings);

  return (
    // data-theme is corrected by ThemeScript before first paint, hence suppressHydrationWarning.
    <html
      lang={locale}
      id="top"
      data-theme="day"
      className={`${fontVariables} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider>
          <SkipLink label={t("skip")} />
          <AppEffects />
          <SmoothScroll />
          <CanvasRoot />
          <Nav cv={getCvLink(settings)} availabilityLabel={availabilityLabel} />
          <main id="content" tabIndex={-1} className="relative z-10 outline-none">
            {children}
          </main>
          <div className="relative z-10">
            <Footer locale={locale} />
          </div>
          <div className="grain" aria-hidden="true" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
