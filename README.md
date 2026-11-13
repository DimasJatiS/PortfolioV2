# Summit

Immersive 3D portfolio of **Dimas Jati Satria — Software Engineer**.
One apex, four faces: a glass pyramid guides the scroll,
and the work is built from the base up.

Live: [dimassj.vercel.app](https://dimassj.vercel.app) · Status: **F1 — foundation and 3D spike**

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components), React 19, TypeScript strict |
| 3D | three.js, React Three Fiber, drei (`MeshTransmissionMaterial`), GLSL, maath |
| Styling | Tailwind CSS 4, CSS-variable design tokens, `data-theme` Day / Night |
| i18n | next-intl — English at `/`, Bahasa Indonesia at `/id` |
| Content | Sanity (server-only client, GROQ), bundled seed content as fallback |
| State | Zustand |
| Quality | ESLint, Prettier, Vitest, Playwright, GitHub Actions |

## Getting started

Requires Node 24 LTS (see `.nvmrc`) and pnpm. Versions are pinned exactly in
`package.json` and `pnpm-lock.yaml`.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

No environment variables are needed to run it: without Sanity credentials the
site renders the seed content in `sanity/seed/data.ts`.

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Develop, build, serve |
| `pnpm check` | Lint + typecheck + unit tests |
| `pnpm test:e2e` | Playwright smoke tests (run `pnpm build` first) |
| `pnpm format` | Prettier |
| `pnpm assets` | Fetch Clash Display, sync GPU benchmark tables |
| `pnpm audio` | Synthesise the ambient pad and glass clicks into `public/audio/` (original, no third-party licence) |
| `pnpm model` | Build `public/models/pyramid.glb` with Blender, headless (needs `blender` on PATH) |
| `pnpm seed` | Import seed content into Sanity (`--dry-run`, `--overwrite`) |

Useful URLs while developing:

- `/styleguide` — the style tile: tokens, contrast table, type, components, Day and Night
- `?tier=high|medium|low` — force a quality tier (and disable auto-degrade)
- `?perf` — FPS, draw calls, triangles, DPR overlay
- `/?progress=0.42` — open the Home story at that point (0–1); `/#faces` lands on a chapter
- `?freeze` — stop time-based motion, so one progress value is one exact frame
- `?chapters` — overlay with story progress, chapter and key track values

## Connecting Sanity

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage) (free plan).
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SANITY_PROJECT_ID`.
3. Studio: `cd studio && cp .env.example .env`, set the same project id, then
   `pnpm install && pnpm dev`. Deploy with `pnpm run deploy` (→ `*.sanity.studio`).
4. Seed: add an Editor token as `SANITY_WRITE_TOKEN`, then `pnpm seed`.
5. Webhook (API → Webhooks): URL `https://<site>/api/revalidate`, projection
   `{_type}`, and a secret that matches `SANITY_REVALIDATE_SECRET`.

The Studio is a separate project in `studio/` with its own lockfile, so the
website never installs or bundles Studio code.

## Architecture

```
app/
  [locale]/            root layout + all pages (EN and ID from one tree)
  api/revalidate/      Sanity publish webhook → revalidateTag
components/
  canvas/              persistent WebGL scene: Pyramid, Rays, ApexFlare, environment
  dom/                 Nav, Footer, Section, buttons, cards, toggles, SVG fallback
  ui/                  Magic UI (Meteors, KineticText), adapted to the brand
i18n/  messages/       routing, request config, EN + ID copy deck
lib/                   tokens, motion, store, quality tiers, content layer, SEO
sanity/                client (server-only), GROQ queries, types, seed data
shaders/               GLSL for rays and flare
studio/                Sanity Studio (deployed separately)
tests/  e2e/           Vitest unit tests, Playwright smoke tests
```

### Decisions worth knowing

**The Home is a film played by the scroll.** `lib/chapters.ts` maps the story
(heights, progress ranges, rest poses); `StoryDriver` turns native scroll,
smoothed by Lenis, into damped progress; `lib/story.ts` and
`lib/camera-path.ts` turn progress into every animated value as pure
functions, so a frame is identical whether reached scrolling down or up (unit
tested). Text stays real HTML in sticky chapter panels and is shown by CSS
around each rest pose. With `prefers-reduced-motion` or without JavaScript, the
Home is an ordinary stacked page.

**One persistent canvas.** `CanvasRoot` lives in the root layout, behind the
DOM. Text, links and forms stay real HTML (SEO, accessibility, text selection),
and navigating never remounts WebGL.

**Nothing blank, ever.** The pyramid is first rendered as a themed SVG. WebGL
replaces it only when the device can afford it:

| Condition | Result |
| --- | --- |
| No WebGL, context lost, scene error | Static SVG pyramid |
| `detect-gpu` tier 0–1, or under 30 fps for 2 s | Static SVG pyramid |
| Tier 2, or tier 3 on mobile | Scene at DPR 1–1.5, 4 samples, no backside pass |
| Tier 3 desktop | Scene at DPR ≤ 2, 8 samples, backside pass |
| `prefers-reduced-motion` | One still frame, no animation |

three.js is loaded with a dynamic import after the hero HTML, the render loop
stops when the tab is hidden or the 3D area has scrolled away, and the GPU
benchmark tables are self-hosted so detection makes no third-party request.

**Fully static pages.** The root layout sets `ensureStatic = "navigation"`:
every page is prerendered from cached content and the build fails if a route
starts depending on request data. Content getters are `use cache` functions
tagged by document type; publishing in Sanity expires the tag.

**The CMS cannot take the site down.** Every query result is validated with
Zod. If Sanity is not configured, is unreachable, or returns malformed data,
the same GROQ queries run against the bundled seed dataset with groq-js. The
test suite runs every query that way, so the fallback is always known to work.

**Tokens as the single source.** Colours and motion values are CSS variables
with a TypeScript mirror for the scene; a test fails if they drift. Day/Night
is a token swap on `data-theme`, applied before first paint by an inline script.

**Contrast is tested.** `tests/tokens.test.ts` checks every text pair in both
themes against WCAG AA. The audit added three shades to the PRD palette
(`orange-800`, `orange-400`, `ink-600`); see `/styleguide`.

## Performance budget (PRD 9.1)

| Item | Budget | Now |
| --- | --- | --- |
| Fonts (4 families, Latin subset) | ≤ 160 KB | 96 KB |
| 3D assets, first chapter (what the loader waits for) | ≤ 1.2 MB | 0.41 MB (HDRI downscaled from 1.6 MB) |
| 3D assets, whole story (loaded per chapter) | ≤ 5 MB | 0.41 MB |
| Audio (loaded only when sound is on) | ≤ 450 KB | 236 KB |
| Draw calls | ≤ 100 | 4 |

The budgets follow PRD v2.0: the Home page is a scroll-driven story in five
chapters. Its graybox (camera path, block shell, inversion, keyboard and deep
links) is built; dispersion, the guide ray, callouts and project media are next.

## Assets and licences

- **Clash Display** (Indian Type Foundry, ITF Free Font Licence). Free to
  self-host, but not to redistribute through a repository, so the file is
  git-ignored and downloaded by `pnpm assets`.
- **Geist, Geist Mono, Instrument Serif** — SIL Open Font Licence.
- **Studio Small 03 HDRI** — Poly Haven, CC0. Downscaled with
  `scripts/hdr-downscale.mjs`.
- **Geometric light** direction is inspired by Zach Lieberman's studies; the
  implementation is original.
