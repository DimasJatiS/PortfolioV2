import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { AvailabilityBadge } from "@/components/dom/AvailabilityBadge";
import { Button } from "@/components/dom/Button";
import { PageHeader } from "@/components/dom/PageHeader";
import { ProjectCard } from "@/components/dom/ProjectCard";
import { StaticPrism } from "@/components/dom/StaticPrism";
import { Tag } from "@/components/dom/Tag";
import { KineticText } from "@/components/ui/kinetic-text";
import { AA_TEXT, contrastRatio, gradeContrast } from "@/lib/contrast";
import { resolveLocale } from "@/lib/locale";
import { duration, easeCss, springUi, stagger } from "@/lib/motion";
import {
  derivedTokens,
  palette,
  primaryButton,
  spectrum,
  surfaces,
  themes,
  type PaletteToken,
  type SurfaceName,
  type Theme,
} from "@/lib/tokens";
import type { Project } from "@/sanity/types";

type Props = PageProps<"/[locale]/styleguide">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "styleguide" });
  // Internal reference page: reachable by URL, never indexed.
  return { title: t("title"), robots: { index: false, follow: false } };
}

const MOOD = ["precise", "crafted", "warm-luxury", "editorial", "calm motion"];
const AVOID = ["neon glow", "purple / violet", "generic web3 template"];
const SUMMIT_ELEMENTS = [
  {
    title: "Apex flare",
    body: "An orange light at the apex, fading to ivory, pulsing every 4s.",
  },
  {
    title: "Hairline rays",
    body: "24–40 one-pixel lines from apex to base; reused as section dividers.",
  },
  {
    title: "Wide-tracked type",
    body: "Thin capitals at 0.3em tracking for the name and section titles.",
  },
];

const SURFACE_LABEL: Record<SurfaceName, string> = {
  base: "Base · 60%",
  alt: "Alt · cards",
  inverse: "Inverse · sections",
};

const SAMPLE_PROJECT: Project = {
  id: "sample",
  title: "TBXxpert",
  slug: "tbxxpert",
  number: 2,
  featured: true,
  categories: ["mobile", "ai"],
  summary: "AI-powered mobile app that screens for tuberculosis from cough audio.",
  role: undefined,
  duration: undefined,
  stack: ["Flutter", "FastAPI", "Gemini API"],
  liveUrl: undefined,
  repoUrl: undefined,
  publishedAt: undefined,
  hasCaseStudy: false,
};

function Swatch({ token }: { token: PaletteToken }) {
  const derived = derivedTokens.includes(token);
  return (
    <li className="flex flex-col gap-2">
      <span
        className="border-line block h-16 rounded-xl border"
        style={{ background: palette[token] }}
      />
      <span className="font-mono text-[0.75rem] leading-4">
        {token}
        {derived && <sup title="Derived during the contrast audit"> *</sup>}
        <br />
        <span className="text-muted">{palette[token]}</span>
      </span>
    </li>
  );
}

function ContrastTable({ theme }: { theme: Theme }) {
  const rows = (Object.keys(surfaces[theme]) as SurfaceName[]).flatMap((surface) => {
    const tokens = surfaces[theme][surface];
    return (
      [
        ["Body text", tokens.fg, AA_TEXT],
        ["Muted text", tokens.fgMuted, AA_TEXT],
        ["Heading", tokens.heading, AA_TEXT],
        ["Small accent text", tokens.accentText, AA_TEXT],
        ["Accent (>= 24px / non-text)", tokens.accent, 3],
      ] as const
    ).map(([role, token, minimum]) => {
      const ratio = contrastRatio(palette[token], palette[tokens.bg]);
      return {
        surface,
        role,
        token,
        bg: tokens.bg,
        ratio,
        pass: ratio >= minimum,
        minimum,
      };
    });
  });

  return (
    <table className="w-full border-collapse text-left font-mono text-[0.75rem] leading-5">
      <caption className="sr-only">Contrast ratios, {theme} theme</caption>
      <thead>
        <tr className="border-line text-muted border-b">
          <th scope="col" className="py-2 pr-3 font-normal">
            Surface
          </th>
          <th scope="col" className="py-2 pr-3 font-normal">
            Role
          </th>
          <th scope="col" className="py-2 pr-3 font-normal">
            Pair
          </th>
          <th scope="col" className="py-2 text-right font-normal">
            Ratio
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.surface}-${row.role}`} className="border-line/60 border-b">
            <td className="py-1.5 pr-3">{SURFACE_LABEL[row.surface]}</td>
            <td className="py-1.5 pr-3">{row.role}</td>
            <td className="py-1.5 pr-3">
              {row.token} / {row.bg}
            </td>
            <td className="py-1.5 text-right whitespace-nowrap">
              {row.ratio.toFixed(2)} {row.pass ? "✓" : "✗"}{" "}
              <span className="text-muted">{gradeContrast(row.ratio)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** One full tile, scoped to a theme through the data-theme attribute. */
function ThemeTile({ theme, availability }: { theme: Theme; availability: string }) {
  return (
    <div
      data-theme={theme}
      className="bg-surface text-fg border-line flex flex-col gap-12 rounded-3xl border p-6 md:p-10"
    >
      <p className="type-label text-muted">Mode · {theme}</p>

      {/* Hero sample */}
      <div className="relative flex flex-col items-center gap-4 overflow-hidden py-6 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto aspect-square w-56 opacity-90">
          <StaticPrism />
        </div>
        <p className="type-label text-accent-text relative">LONG LIVE LEARNER</p>
        <KineticText
          text="DIMAS JATI"
          className="type-designer text-heading text-step-3 relative mt-14 block"
        />
        <p className="type-statement text-heading text-step-2 relative max-w-[20ch]">
          Software engineer turning curiosity into{" "}
          <em className="type-accent text-accent-text">crafted</em> products.
        </p>
        <AvailabilityBadge label={availability} className="relative justify-center" />
      </div>

      {/* Buttons */}
      <div>
        <p className="type-label text-muted mb-4">Buttons</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="type-label text-muted mb-4">Skill tags</p>
        <div className="flex flex-wrap gap-2">
          {["React", "Next.js", "TypeScript", "three.js / R3F", "Flutter"].map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>

      {/* Project card */}
      <div>
        <p className="type-label text-muted mb-4">Project card / shard</p>
        <div className="max-w-md">
          <ProjectCard
            project={SAMPLE_PROJECT}
            categoryLabels={{ mobile: "Mobile", ai: "AI" }}
            stackLabel="Stack"
            cta="Read case study"
          />
        </div>
      </div>

      {/* Inverse surface */}
      <div className="surface-inverse rounded-2xl p-6">
        <p className="type-label text-muted">Inverse surface</p>
        <p className="type-statement text-heading text-step-2 mt-3">
          Light in, work out.
        </p>
        <p className="mt-2">
          Body text with a{" "}
          <span className="text-accent-text underline">small accent link</span>.
        </p>
      </div>

      {/* Contrast */}
      <div>
        <p className="type-label text-muted mb-4">
          Contrast (WCAG 2.2 AA, text ≥ 4.5 : 1)
        </p>
        <div className="overflow-x-auto">
          <ContrastTable theme={theme} />
        </div>
      </div>
    </div>
  );
}

export default async function StyleguidePage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });
  const availability = t("availability.label", {
    start: "Feb 2027",
    months: 4,
    mode: t("availability.mode.both"),
  });
  const buttonRatio = contrastRatio(palette[primaryButton.fg], palette[primaryButton.bg]);

  return (
    <>
      <PageHeader
        title={t("styleguide.title")}
        eyebrow="F0 · Refraction"
        lead={t("styleguide.lead")}
      />

      <div className="bg-surface pb-24">
        <div className="container-page flex flex-col gap-20">
          {/* Direction */}
          <section aria-labelledby="sg-direction" className="grid-page gap-y-10">
            <h2
              id="sg-direction"
              className="type-label text-muted col-span-4 md:col-span-6 lg:col-span-12"
            >
              01 · Direction
            </h2>
            <div className="col-span-4 md:col-span-3 lg:col-span-4">
              <h3 className="type-label text-heading mb-3">Mood</h3>
              <ul className="flex flex-wrap gap-2">
                {MOOD.map((word) => (
                  <li key={word}>
                    <Tag>{word}</Tag>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-4 md:col-span-3 lg:col-span-4">
              <h3 className="type-label text-heading mb-3">Avoid</h3>
              <ul className="text-muted list-disc space-y-1 pl-5">
                {AVOID.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="col-span-4 md:col-span-6 lg:col-span-4">
              <h3 className="type-label text-heading mb-3">
                Must-have from the summit reference
              </h3>
              <ol className="flex flex-col gap-3">
                {SUMMIT_ELEMENTS.map((element, index) => (
                  <li key={element.title}>
                    <span className="text-accent-text font-mono text-[0.8125rem]">
                      0{index + 1}
                    </span>{" "}
                    <strong className="text-heading font-semibold">
                      {element.title}.
                    </strong>{" "}
                    <span className="text-muted">{element.body}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Colour */}
          <section aria-labelledby="sg-colour">
            <h2 id="sg-colour" className="type-label text-muted mb-6">
              02 · Colour tokens
            </h2>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              {(Object.keys(palette) as PaletteToken[]).map((token) => (
                <Swatch key={token} token={token} />
              ))}
            </ul>
            <p className="text-muted mt-6 max-w-[80ch] text-[0.9375rem]">
              * Derived during the contrast audit, not in the PRD table. orange-700 on
              ivory-100 reaches only{" "}
              {contrastRatio(palette["orange-700"], palette["ivory-100"]).toFixed(2)} : 1
              and orange-500 on green-900 only{" "}
              {contrastRatio(palette["orange-500"], palette["green-900"]).toFixed(2)} : 1,
              so small accent text uses orange-800 on cards and orange-400 on dark
              surfaces. The primary button sets ink-900 on orange-500 (
              {buttonRatio.toFixed(2)} : 1); ivory on orange would be{" "}
              {contrastRatio(palette["ivory-50"], palette["orange-500"]).toFixed(2)} : 1.
            </p>
            <h3 className="type-label text-heading mt-10 mb-3">
              Brand spectrum (dispersion)
            </h3>
            <div
              className="border-line h-10 rounded-full border"
              style={{
                background: `linear-gradient(90deg, ${spectrum.map((token) => palette[token]).join(", ")})`,
              }}
            />
          </section>

          {/* Type */}
          <section aria-labelledby="sg-type">
            <h2 id="sg-type" className="type-label text-muted mb-6">
              03 · Typography
            </h2>
            <dl className="divide-line border-line divide-y border-y">
              {[
                {
                  role: "Display · Clash Display 600",
                  sample: "Light in, work out.",
                  className: "type-statement text-step-4 text-heading",
                },
                {
                  role: "Designer · Clash Display 200, 0.3em",
                  sample: "LONG LIVE LEARNER",
                  className: "type-designer text-step-2 text-heading",
                },
                {
                  role: "Accent · Instrument Serif italic",
                  sample: "crafted products",
                  className: "type-accent text-step-3 text-accent-text",
                },
                {
                  role: "Body · Geist 16–18 / 1.6",
                  sample:
                    "I keep learning, because every new thing I learn changes what I can build.",
                  className: "text-step-0",
                },
                {
                  role: "Label · Geist Mono, 0.08em",
                  sample: "01 / 05 · Incidence",
                  className: "type-label",
                },
              ].map((row) => (
                <div key={row.role} className="grid-page items-baseline gap-y-2 py-6">
                  <dt className="type-label text-muted col-span-4 md:col-span-2 lg:col-span-3">
                    {row.role}
                  </dt>
                  <dd className={`col-span-4 lg:col-span-9 ${row.className}`}>
                    {row.sample}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Components in both themes */}
          <section aria-labelledby="sg-tiles">
            <h2 id="sg-tiles" className="type-label text-muted mb-6">
              04 · Style tile — Day and Night
            </h2>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {themes.map((theme) => (
                <ThemeTile key={theme} theme={theme} availability={availability} />
              ))}
            </div>
          </section>

          {/* Motion */}
          <section aria-labelledby="sg-motion">
            <h2 id="sg-motion" className="type-label text-muted mb-6">
              05 · Motion tokens
            </h2>
            <ul className="grid grid-cols-1 gap-4 font-mono text-[0.8125rem] sm:grid-cols-2 lg:grid-cols-3">
              <li>ease-light · {easeCss.light}</li>
              <li>ease-inout · {easeCss.inout}</li>
              {Object.entries(duration).map(([name, value]) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="w-28">
                    dur-{name} · {value}ms
                  </span>
                  <span className="bg-line/40 relative h-1 flex-1 overflow-hidden rounded-full">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-orange-500"
                      style={
                        { width: `${(value / duration.xl) * 100}%` } as CSSProperties
                      }
                    />
                  </span>
                </li>
              ))}
              <li>stagger-char · {stagger.char}ms</li>
              <li>stagger-line · {stagger.line}ms</li>
              <li>
                spring-ui · stiffness {springUi.stiffness}, damping {springUi.damping}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
