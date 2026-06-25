# AstroPaper v6 adoption — review + migration roadmap — June 2026

**Date:** 2026-06-26
**Branch:** plan only (execution would be a fresh `v6-adoption` branch off clean `main`)
**Author:** Jon (with Claude)
**Status:** Planned — **read the Decision Point first.** This scopes a large, multi-day effort.

## Why this plan exists (the review)

This started from a concern that, when we restored the jobs branch from Astro 5 back to
Astro 6 this session, we "missed the AstroPaper bump." **A careful review shows the Astro
6 _framework_ migration was NOT missed and is complete:**

- On `narrative-job-board-jm`, `package.json`, `astro.config.ts`, `src/content.config.ts`,
  and `pnpm-lock.yaml` are **byte-for-byte identical to `origin/main`** — all on
  `astro ^6.4.8`, the v6 `unified()` markdown processor, `z` from `astro/zod`, Content
  Layer `glob` loaders, and **zero Astro-5 APIs** (`Astro.glob`, `getEntryBySlug`, old
  image API, `toggle-theme.js`). `main` is an ancestor of the branch, so it has all of
  main's Astro 6 work. The restore commit (`cc5c7f0`) was complete; builds are green.

**What is genuinely behind is the AstroPaper _theme_** — and that's the real subject here.
Our fork is structurally **AstroPaper v5.5.1** (per `package.json` `version` + README),
while **upstream is now v6** (`astro-paper-v6`, commit `f0b644d feat!: AstroPaper v6`) — a
**ground-up rewrite**. Adopting it was a *deliberate, documented deferral* (see
[2026-06-23-dependency-maintenance.md](./2026-06-23-dependency-maintenance.md) and
CLAUDE.md "Upstream Theme"), not an oversight: the rewrite is too structural to
merge/cherry-pick into our diverged tree.

**So: framework bump = done. Theme rewrite = a separate, large project.** This document
scopes that full adoption.

## ⚠️ Decision Point — full adoption vs selective port (decide before Phase 0)

Adopting upstream v6 **wholesale is marginal-value for _this_ fork**, for two reasons the
review surfaced:

1. The usual #1 reason to adopt v6 — getting onto Astro 6 — **does not apply** (we're
   already on `astro ^6.4.8`).
2. **Our content schema already equals v6's `posts` schema** (identical Zod fields); only
   the collection name/base path differ. No content-modernization payoff.

**What full adoption _does_ buy:** the cleaner config split (`astro-paper.config.ts`),
native Astro fonts + `svgOptimizer` perf, `rehype-callouts`, v6's head-slot layout
pattern, and — most valuable long-term — **re-alignment with upstream so future
`git merge upstream/main` becomes cheap** (today we're ~234 commits diverged; every pull
is painful).

**What it costs:** ≈ **11–14 engineer-days** + real regression risk across **five custom
subsystems + the CMS** (palette, jobs board, events/Google Calendar, Sveltia CMS, OG
generation).

| Option | Effort/Risk | Gets you |
|---|---|---|
| **Selective port (recommended unless mergeability is the goal)** | ~30% | `rehype-callouts`, native fonts, `svgOptimizer`, the config split — left on our layout/content/CMS structure. ~70% of the benefit. |
| **Full v6 adoption (this roadmap)** | 100% (11–14 days) | All of the above + upstream re-alignment / cheap future merges. |

The full-adoption roadmap below is the plan of record per the request; the selective port
remains the lower-risk alternative if upstream-mergeability isn't a priority.

## The two sides (target vs source)

**TARGET — AstroPaper v6 architecture (`upstream/main`):**
- **Config split:** `astro-paper.config.ts` (root; `defineAstroPaperConfig({site, posts, features, socials, shareLinks})`) → `src/config.ts` (resolved) → `src/types/config.ts`.
- **Layouts:** `Layout.astro` (base HTML/head/meta/OG; native `<Font>`; FOUC script; `ClientRouter`; **`<slot name="head">`**) + `PostLayout.astro` (wraps Layout, injects BlogPosting JSON-LD via the head slot). Component `Main.astro`.
- **i18n** (`src/i18n/`): `UIStrings`, `lang/en.ts`, `useTranslations(locale)` — **woven into Header/Layout/RSS** via `astro:i18n` + `@/utils/withBase`. `astro.config` i18n `routing:{prefixDefaultLocale:false}` → clean URLs.
- **Content:** `posts` collection (base `src/content/posts`) + a `pages` collection; same schema as ours.
- **Styling:** `src/styles/theme.css` (CSS-var tokens + Tailwind 4 `@theme inline`); adds `--accent-foreground` + `--muted-foreground`. `rehype-callouts/theme/obsidian`.
- **OG:** satori/sharp, gated by `features.dynamicOgImage`.
- Name-keyed socials/shareLinks (`{name, url}` → `src/assets/icons/socials/<name>.svg`).

**SOURCE — our customizations to preserve (re-port risk):**
- **HIGH:** custom **palette** ([global.css](../../src/styles/global.css), light/dark hex consumed by many `color-mix()`); **jobs** ([jobs.astro](../../src/pages/jobs.astro) ~600 LOC + [jobs.ts](../../src/lib/jobs.ts) + [JobCard.astro](../../src/components/JobCard.astro) + CSV + `--jobs-*` tokens); **events** ([events.astro](../../src/pages/events.astro), `googleapis` Google Calendar + `GOOGLE_CALENDAR_API_KEY` + static table + `/jams→/events` redirect); **Sveltia CMS** ([config.yml](../../public/admin/config.yml): 3 folder collections incl. `_events`/`_spotlights` + asset_collections + GameEmbed editor component); **content structure** (`src/data/blog/` + `_events`/`_spotlights` + [getPath.ts](../../src/utils/getPath.ts) underscore-flatten → `/posts/<slug>`); **OG templates** (`src/utils/og-templates/*`, `loadGoogleFont`, `generateOgImages`).
- **MED:** [Layout.astro](../../src/layouts/Layout.astro) additions (conditional JSON-LD BlogPosting/WebSite/WebPage, Vercel analytics + speed-insights, theme.ts, google verification); our 4 layouts (Layout/DefaultLayout/Main/PostDetails) vs v6's 2; astro.config env schema; the recent page-normalization + sitewide-JSON-LD work.
- **LOW:** GameEmbed, the `.mdx` pages, index/404/search/tags/archives/posts, config.ts/constants.ts, most utils.

## Strategy: fresh v6 scaffold on a throwaway branch, port in phases

Branch **`v6-adoption` from a clean `main`** (NOT the diverged feature branch, NOT a
churned tree). **`main` stays untouched the entire effort — that is the rollback.**

Why scaffold-then-port (not in-place transform): v6 changed file *locations and contracts*
(layout split, config split, new `src/i18n/`, `withBase.ts`, colocated `_components`, a
`pages` collection). A scaffold is buildable from minute one and each phase verifies green;
an in-place transform keeps the build red for days and turns git history into a rename blob.
Our divergence is large but *concentrated in discrete, self-contained files* — porting them
onto a known-good base is the lower-risk direction. The schema match means "port content"
is mostly *copy the tree + point the loader at it*.

## Decisions to resolve (recommendations given)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Content path: `src/data/blog` vs v6 `src/content/posts` | **KEEP `src/data/blog`** (set v6 `BLOG_PATH`). Moving breaks every `/posts/<slug>` URL, the subfolder-collections work, and the CMS. Zero upside. |
| D2 | Collection key: `blog` vs `posts` | **Adopt `posts`** (key only; path stays per D1). CMS uses `folder:` paths, so `config.yml` is untouched. |
| D3 | i18n: adopt en-only vs rip out | **ADOPT (en-only).** It's woven into Header/Layout/RSS; removing it reintroduces breakage on every future merge. URLs stay identical. |
| D4 | Layouts: keep our 4 vs v6's 2 | **Collapse to v6's 2** + a thin `DefaultLayout` shim (for our `.mdx` pages) rebuilt on v6's Layout; map PostDetails→PostLayout. |
| D5 | Component set | **Take v6's by default; keep JobCard + GameEmbed.** |
| D6 | Vercel analytics + speed-insights | **Re-add** in v6 `<body>`. |
| D7 | Dynamic OG | **Keep OFF initially** (matches prod; shrinks surface); flip on later as an isolated change. |
| D8 | Fonts | **Adopt v6 native `<Font>`**; verify OG `loadGoogleFont` still resolves. |
| D9 | `svgOptimizer` | **Adopt** (low risk). |
| D10 | Package manager | **Stay on npm** (regenerate lockfile; upstream ships pnpm). |

## Phased roadmap (each phase ends GREEN: `pnpm build` + named smoke tests)

- **P0 — Branch hygiene + v6 scaffold** (~1–1.5d): resolve the working-tree whitespace/line-ending churn + lock `.gitattributes`; cut `v6-adoption` from clean `main`; bring in v6's config system, `src/i18n/`, `withBase.ts`, `Layout`/`PostLayout`, `src/styles/*`, `astro.config.ts`, v6 components + routes as the base; reconcile deps (add our `@vercel/*`, `googleapis`, `dayjs`, `lodash.kebabcase`; keep `rehype-callouts`). **Gate:** vanilla v6 builds/previews; home + sample post + `/search` render; theme toggle works.
- **P1 — Config + astro.config** (~1d): translate `SITE` → `defineAstroPaperConfig`; re-express 7 socials + 6 share links (inventory `src/assets/icons/socials/` first; supply Discord/Bluesky/RSS SVGs if missing); re-add `/jams→/events` redirect + `GOOGLE_CALENDAR_API_KEY` + `PUBLIC_GOOGLE_SITE_VERIFICATION`. **Gate:** socials + verification meta + `/jams` 301.
- **P2 — Styling/palette** (~0.5–1d): transplant our light/dark hex into `theme.css`; **add `--accent-foreground` + `--muted-foreground`**; carry `--jobs-*` tokens; re-add `.active-nav`/`max-w-app`/`app-layout` utilities. **Gate:** OUR palette in both themes; callouts render.
- **P3 — Layouts + head plumbing** (~2–2.5d): adopt v6 `Layout`; via `<slot name="head">` re-introduce the WebSite/WebPage JSON-LD branch (a `SeoJsonLd.astro` for non-post pages) + Vercel analytics + speed-insights; map PostDetails→PostLayout + `posts/[...slug]/index.astro` (progress bar, heading anchors, copy-code, prev/next, `<Content components={{GameEmbed}}/>`); rebuild `DefaultLayout` shim; port `Main`'s `wide`/`titleTransition` props (used by jobs). **Gate:** correct title/canonical/OG/JSON-LD per page type; analytics present; post interactions work.
- **P4 — Content collections + URL parity** (~1.5d): v6 `content.config.ts` with `BLOG_PATH="src/data/blog"` (D1), key `posts` (D2); copy our `src/data/blog/` verbatim; port `getPath.ts` underscore-flatten and reconcile vs v6's `getPostPaths.ts` so OUR `/posts/<slug>` flattening wins; update all `blog`→`posts` call sites. **Gate (highest-impact):** diff generated routes vs the production sitemap — EVERY `/posts/<slug>` (incl. former `_events`/`_spotlights`) matches; RSS/tags/archives intact; no 404s.
- **P5 — i18n + nav** (~0.5–1d): keep v6 `src/i18n/`; review `en.ts` copy; re-add our 6 nav links (About/Events/Constitution/Posts/Tags/Jobs, desktop+mobile) into v6 `Header` preserving its `getRelativeLocaleUrl`/`isActive` + our `active-nav` styling. **Gate:** nav + active states; no `/en/` prefix.
- **P6 — Re-apply custom features (most-isolated first)** (~2.5–3.5d): 6a jobs, 6b events (+ `googleapis`, graceful no-key fallback), 6c GameEmbed/jams, 6d about/constitution/survey `.mdx`, 6e OG templates (keep `dynamicOgImage:false`). **Gate per feature:** `/jobs` filters; `/events` + table + redirect; GameEmbed iframe; `.mdx` pages; `/og.png`.
- **P7 — Sveltia CMS revalidation (preview-deploy gated)** (~0.5–1d): because D1 kept the content path, `config.yml` needs ~zero structural change; verify the 3 collections + asset_collections + GameEmbed editor component; reconcile `backend.branch: draft`. **Gate (on preview):** `/admin` loads; 3 collections list; edit round-trips to GitHub; image picker + GameEmbed work.
- **P8 — Integrations + full smoke + perf** (~1d): Pagefind build + `/search`; Vercel beacons on preview; sitemap/robots/RSS diff vs prod; Lighthouse home + post.
- **P9 — Cutover** (~0.5d): final smoke + sign-off; reconcile CMS `backend.branch`; tag pre-cutover `main`; merge `v6-adoption`→`main`; keep the branch through soak.

**Effort:** ≈ **11–14 engineer-days** + preview/soak wall-clock. Risk is front-loaded in P3/P4/P6.

## Risk mitigation, validation, rollback

- **URL drift (P4, highest):** diff full route list vs production sitemap; any `/posts/<slug>` delta is a blocker; test `_events`/`_spotlights` entries explicitly.
- **Missing v6 tokens (P2):** define `--accent-foreground`/`--muted-foreground` up front; grep v6 components for `*-foreground`.
- **Social icon name mismatch (P1):** inventory icon set early; supply missing SVGs.
- **i18n coupling (P5):** adopt, never hand-edit `astro:i18n` call sites out.
- **googleapis weight + secret (P6b):** keep Events isolated; ensure the no-key fallback builds so preview/CI without the secret pass.
- **CMS regression (P7):** highest uncertainty (deploy-only test); D1 keeps `config.yml` untouched; gate on a real preview round-trip.
- **Lost fork fixes among 234 commits:** scaffold-and-port forces explicit re-introduction of each custom file; cross-check the recent jobs-normalization + sitewide-JSON-LD commits land.
- **Rollback:** all work on throwaway `v6-adoption`; `main` untouched until P9. Pre-cutover = `git checkout main` + delete branch. Post-cutover = redeploy the tagged pre-merge `main`; re-point Sveltia `backend.branch` carefully.

**Smoke matrix (full at P8–9):** home (palette light+dark, JSON-LD=WebSite) · post (transitions, Datetime, tags, prev/next, ShareLinks, progress bar, copy-code, anchors, BackToTop, JSON-LD=BlogPosting, OG) · `/jobs` (roles + country/company filters) · `/events` (events or fallback + table + `/jams` redirect) · `/admin` on preview (3 collections, edit round-trip, image picker, GameEmbed) · OG (`/og.png`) · theme toggle persists across view-transition nav · `/search` body hits · sitemap/RSS/robots match prod, no new 404s.

## Critical files (execution)
- `astro-paper.config.ts` (new; from `src/config.ts` + `src/constants.ts`)
- `src/content.config.ts` (D1/D2 `BLOG_PATH` + key)
- `src/layouts/Layout.astro` (head-slot + analytics/JSON-LD reconciliation)
- `src/styles/theme.css` (palette transplant + new `*-foreground` + `--jobs-*`)
- `src/utils/getPath.ts` (URL-parity-critical underscore flatten)
