# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the website for the IGDA Game Writing Special Interest Group (game-writing.com). It's built with Astro using the AstroPaper theme, styled with Tailwind CSS, and uses Sveltia CMS for content management.

## Commands

```bash
pnpm dev              # Start dev server at localhost:4321
pnpm build            # Type check, build, generate Pagefind search index
pnpm preview          # Preview production build
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
pnpm sync             # Generate TypeScript types for Astro modules
```

## Architecture

### Content System

- **Blog posts**: `src/data/blog/` as MDX files with `YYYY-MM-DD-slug.mdx` naming convention
- **Content schema**: `src/content.config.ts` defines the blog collection with Zod validation
- **Post frontmatter**: title, description, author, pubDatetime, slug, featured, draft, tags
- **Reference posts**: `src/data/blog/examples/` and `_releases/` are stock AstroPaper demo posts kept **intentionally** as living documentation/examples (all `draft: true`, so excluded from the build and never routed). They demonstrate theme features — including ones we haven't adopted yet (e.g. code-block rendering, callouts, advanced typography) — so the worked example is already here if/when we enable one. Leave them drafted; don't delete them.

### Configuration

- **Site settings**: `src/config.ts` (site URL, author, title, etc.)
- **Social links**: `src/constants.ts` (SOCIALS and SHARE_LINKS arrays)
- **Environment variables**: declared with a typed schema in `astro.config.ts` (`env`/`envField`); set in local `.env` and as Vercel env vars. Build-time secrets use `access: "secret", context: "server"` (e.g. `GOOGLE_CALENDAR_API_KEY`, read at build by `src/pages/events.astro`) and never reach the client bundle since the site is SSG. All are `optional` and degrade gracefully. Document and reuse this pattern for new build-time integrations — see the **Environment Variables** section in `README.md`.

### Page metadata (titles & descriptions)

Two independent layers, wired per page (this split is stock AstroPaper, kept in v6):

- **`Layout.astro` `title` / `description`** → the `<head>`: browser-tab `<title>`, `<meta name="description">`, OG/Twitter cards, JSON-LD. Defaults to `SITE.title` / `SITE.desc`.
- **`Main.astro` `pageTitle` / `pageDesc`** → the **visible** on-page `<h1>` + italic intro. Not in `<head>`.

Conventions:

- `title` (tab/SEO) and `pageTitle` (visible heading) are **separate props**, set independently per page — `title` builds the `<head>`/tab string, `pageTitle` the visible `<h1>`. The theme treats them as distinct (they're free to differ; today our pages keep them aligned), so setting one does not set the other.
- **Single-source the description** (convention added 2026-06-27): hub/custom pages declare one `const pageDesc` and pass it to **both** `<Main pageDesc={pageDesc}>` (visible) and `<Layout description={pageDesc}>` (`<head>`), so the SEO/OG/JSON-LD description is the real per-page text, not `SITE.desc`. `.mdx` content pages set a `description:` frontmatter line, forwarded by `DefaultLayout`. New hub/custom pages should follow this. See `docs/plans/2026-06-27-page-meta-descriptions.md`.
- The `` | ${SITE.title} `` title suffix is applied **per call site** (matches stock + v6); centralizing it ("decision B") is deliberately deferred. Do not centralize it without re-reading that plan.

### CMS

- **Sveltia CMS**: `public/admin/` with config.yml and custom editor components
- **Version**: loaded unpinned from CDN (`@sveltia/cms` in `public/admin/index.html`), so always the latest release — re-check the [releases](https://github.com/sveltia/sveltia-cms/releases) before relying on specific behavior. Last full review: **2026-06-23 against v0.167.3** (config audited clean; details in `docs/sveltia-CMS-readme.md`). **Intentionally stay unpinned** — auto-receiving security fixes outweighs the small risk of a pre-1.0 behavior change. Track the last-reviewed version in the docs as the baseline; pin _reactively_ only if an auto-update ever regresses our workflow.
- **Draft workflow**: CMS commits to `draft` branch, merged to `main` for production
- **GameEmbed component**: Custom MDX component for embedding Arcweave games, inserted via a `CMS.registerEditorComponent` editor component in `index.html` (officially supported)
- **`public_folder` is an Astro alias, not a web path**: `public_folder: "@/assets/"` is an intentional, out-of-spec deviation so body images go through Astro image optimization — do NOT change it to a `/assets` web path
- **Body widget**: `widget: richtext` is canonical (`markdown` is the back-compat alias); it outputs Markdown, and `<GameEmbed/>` round-trips via the editor component
- **Subfolder limitation**: a collection lists only files directly in its `folder` (no recursive/nested listing) and allows one file extension, so blog posts in `_events`/`_spotlights` and image subfolders aren't editable without dedicated collections / asset collections — see `docs/plans/2026-06-23-cms-subfolder-collections.md`

### Key Directories

- `src/components/` - Astro components (Card, Header, Datetime, JobCard, etc.)
- `src/layouts/` - Page layouts: `Layout` (base), `PostDetails` (posts), `DefaultLayout` (the default for markdown/content pages — formerly `AboutLayout`), `Main` (utility/hub pages)
- `src/pages/` - Route pages including static `.mdx` pages (`about.mdx`, `constitution.mdx`) and custom pages (`events.astro`, `jobs.astro`)
- `src/utils/` - Helper functions for posts, tags, OG images
- `src/lib/` - Standalone build-time libraries (`jobs.ts` parses `src/data/jobs/job_postings.csv` for the jobs board)
- `src/assets/` - Images and icons (also used as CMS media folder)

### Build Output

- Pagefind search index generated during build and copied to `public/pagefind/`
- Static site output to `dist/`

### Theme System

- Theme toggle logic lives in `src/scripts/theme.ts` (loaded non-blocking)
- A minimal inline FOUC-prevention script in `src/layouts/Layout.astro` sets the theme before paint
- `window.theme` types are declared in `src/env.d.ts`
- **Theme conformance (read before styling any page/component):** the theme is **color-only** (5 tokens in `src/styles/global.css`, exposed as `bg-*`/`text-*`/`border-*` utilities). Conform to AstroPaper's flat/minimal language — **borders not shadows**, **opacity not secondary-text-color tokens**, **`bg-muted` for surfaces/hover**, theme tokens via **semantic utilities** (not raw `var()` in `<style>`), and **Tailwind's default scale** (no bespoke px/rem/fractional sizes). Build novel UI in that spirit. Introducing a new token or visual language requires an explicit decision recorded in `docs/plans/` — a feature never extends the theme unilaterally. Full policy + audit rubric: [docs/theme-conformance.md](docs/theme-conformance.md).

## Branch and Deploy Flow

- `main` → production (game-writing.com)
- `draft` → preview (preview.game-writing.com via Vercel)
- Sveltia CMS commits to `draft`; merge to `main` for production
- Feature branches → PR into `main` (or `draft` for preview deploys)

## Upstream Theme

- `upstream` remote points to `satnaing/astro-paper`
- **As of upstream's `feat!: AstroPaper v6` (`f0b644d`), the theme is a ground-up rewrite** (new i18n, `BaseLayout`/`PostLayout` replacing `Layout.astro`, design tokens). Our fork has diverged past the point of merging OR cherry-picking — a `git pull upstream main` would be destructive. Treat upstream as a **reference** for "how to configure X on Astro 6+", and port ideas by hand.
- See `docs/plans/` for maintenance history and decisions

## Dependencies (do not bump without checking)

- We track Astro **6** (matching the upstream theme), not Astro 7. The only majors still held are **Astro 7** (Rust compiler + markdown-engine swap; too fresh, upstream hasn't followed) and **`sharp` 0.35** (native image backend; validate on the Vercel Linux build). ESLint 10, TypeScript 6, and `googleapis` 173 are applied. See the latest plan in `docs/plans/` for revisit triggers.
- `cpx2` was previously pinned to exact `8.0.0` to dodge an `ERR_REQUIRE_ESM` regression; `cpx2@9` migrated to ESM and resolved it, so it is now `^9.0.0` (do not re-pin).
- Astro 6 requires **Node 22.12+** (`engines` field enforces it) — keep Vercel's build Node version at 22+.

## Claude Code Settings

- `.claude/settings.local.json` is per-user (gitignored) — for local permission grants only
- Project-wide Claude Code settings (if any) belong in `.claude/settings.json` (committed)
