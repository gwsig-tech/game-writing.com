# IGDA Game Writing SIG Website

Website for the [IGDA Game Writing Special Interest Group](https://game-writing.com).

Built with [Astro](https://astro.build/) using the [AstroPaper](https://github.com/satnaing/astro-paper) theme (v6), styled with [Tailwind CSS](https://tailwindcss.com/), and managed via [Sveltia CMS](https://github.com/sveltia/sveltia-cms).

## Features

Inherited from [AstroPaper](https://github.com/satnaing/astro-paper):

- [x] Type-safe markdown with Zod validation
- [x] Super fast performance
- [x] Accessible (Keyboard/VoiceOver)
- [x] Responsive (mobile ~ desktop)
- [x] SEO-friendly
- [x] Light & dark mode
- [x] Full-text search via [Pagefind](https://pagefind.app/)
- [x] Draft posts & pagination
- [x] Sitemap & RSS feed
- [x] Dynamic OG image generation

Custom features for this site:

- [x] [Sveltia CMS](https://github.com/sveltia/sveltia-cms) integration with draft workflow
- [x] GameEmbed component for embedding Arcweave interactive games
- [x] Google Calendar API integration for live events
- [x] Game jam showcase pages
- [x] Jobs board — curated game-writing roles from a build-time CSV (`src/data/jobs/`)

## Quick Start

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server at localhost:4321
pnpm build            # Build for production (includes search index)
pnpm preview          # Preview production build
```

## Environment Variables

Environment variables are declared with a typed schema in [`astro.config.ts`](astro.config.ts) (Astro's `env` / `envField`). For development, copy the template and fill in what you need (`cp .env.example .env`) — `.env` is gitignored. Set them as **Vercel Environment Variables** for preview/production builds. [`.env.example`](.env.example) documents every supported variable; all are optional and the site builds with an empty `.env`.

| Variable                          | Access / Context    | Required | Purpose                                                                                                                                                                                                                                                                                                                                                                      |
| :-------------------------------- | :------------------ | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CALENDAR_API_KEY`         | `secret` / `server` | optional | Server-side Google Calendar API key. Read at **build time** in [`src/pages/events.astro`](src/pages/events.astro) to fetch upcoming events via `googleapis`.                                                                                                                                                                                                                 |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | `public` / `client` | optional | Search Console verification token, emitted as a `<meta>` tag in [`src/layouts/Layout.astro`](src/layouts/Layout.astro) **only when set**. Not needed in the current setup — the domain is verified with Google Search Console via a **DNS TXT record** (a one-time, domain-level method), so this meta-tag alternative is redundant and the variable is normally left unset. |

How the build uses these:

- The site is **statically generated (SSG)**, so `secret` / `context: "server"` variables (like `GOOGLE_CALENDAR_API_KEY`) are read on the build machine and **never shipped to the client bundle** — only the rendered output (e.g. the events table) is published.
- Because data is fetched at build time, content refreshes when the site rebuilds. A daily GitHub Actions cron ([`.github/workflows/scheduled-build.yml`](.github/workflows/scheduled-build.yml)) pings a Vercel deploy hook to trigger that rebuild.
- All variables are `optional` and **degrade gracefully** when unset (e.g. `/events` shows a "not configured" message instead of failing the build). Add new build-time integrations using this same pattern.

> **Planned:** live build-time aggregation for the jobs board will introduce `JOBS_SOURCE_URL` (and an optional `JOBS_API_KEY`) following the same `secret` / `server` / `optional` pattern. See [docs/plans/2026-06-26-job-posting-structured-data.md](docs/plans/2026-06-26-job-posting-structured-data.md).

## Project Structure

```text
/
├── .claude/                   # Claude Code project settings (settings.local.json is per-user, gitignored)
├── docs/
│   ├── theme-conformance.md   # Theme conformance standard + audit rubric
│   └── plans/                 # Maintenance and feature plans
├── public/
│   ├── admin/                 # Sveltia CMS configuration
│   │   ├── config.yml         # CMS fields, collections, workflow
│   │   └── index.html         # Custom editor components (GameEmbed)
│   └── pagefind/              # Search index (auto-generated on build)
├── src/
│   ├── assets/
│   │   ├── icons/             # SVG icons (Tabler)
│   │   └── images/            # Site images (also CMS media folder)
│   ├── components/
│   │   ├── GameEmbed.astro    # [Custom] Arcweave game embedding
│   │   ├── JobCard.astro      # [Custom] Jobs board listing card
│   │   ├── Header.astro       # [Modified] Custom navigation
│   │   ├── Card.astro         # Blog post cards
│   │   ├── Datetime.astro     # Date/time display
│   │   ├── Tag.astro          # Tag links
│   │   └── ...                # Other AstroPaper components
│   ├── content/
│   │   └── posts/             # Blog posts (collection `posts`)
│   │       ├── YYYY-MM-DD-slug.mdx
│   │       ├── examples/      # AstroPaper documentation (drafts)
│   │       ├── _releases/     # AstroPaper release notes (drafts)
│   │       ├── _events/       # Event announcements
│   │       └── _spotlights/   # Member spotlights
│   ├── data/
│   │   └── jobs/              # [Custom] Jobs board source (job_postings.csv)
│   ├── i18n/                  # EN-only UI strings (lang/en.ts)
│   ├── layouts/
│   │   ├── Layout.astro       # [Modified] Base HTML/head + head slot + Vercel analytics + theme + JSON-LD
│   │   ├── PostLayout.astro   # Post wrapper (adds BlogPosting JSON-LD via head slot)
│   │   ├── DefaultLayout.astro # [Custom] .mdx content page layout
│   │   └── Main.astro         # Hub/utility page shell
│   ├── pages/
│   │   ├── index.astro        # Homepage
│   │   ├── about.mdx          # About page
│   │   ├── constitution.mdx   # SIG constitution
│   │   ├── events.astro       # [Custom] Google Calendar integration
│   │   ├── jobs.astro         # [Custom] Jobs board (build-time CSV)
│   │   ├── search.astro       # Pagefind search
│   │   ├── jams/              # [Custom] Game jam pages
│   │   ├── posts/             # Blog post routes
│   │   ├── tags/              # Tag archive routes
│   │   └── archives/          # Date-based archives
│   ├── scripts/
│   │   └── theme.ts           # Light/dark theme toggle logic (loaded non-blocking)
│   ├── styles/
│   │   ├── theme.css          # 7 design tokens (light/dark palette)
│   │   ├── global.css         # Tailwind entry + base layer + utilities
│   │   └── typography.css     # Prose/markdown styling
│   ├── utils/                 # Helper functions (getPath, etc.)
│   ├── lib/                   # [Custom] Build-time libs (jobs.ts — CSV jobs board)
│   ├── types/config.ts        # Config types + defineAstroPaperConfig()
│   ├── config.ts              # Resolved config (don't edit — see astro-paper.config.ts)
│   ├── content.config.ts      # Content collection schema (posts)
│   └── env.d.ts               # Ambient type declarations (window.theme)
├── astro-paper.config.ts      # [EDIT HERE] site / socials / shareLinks / features
├── CLAUDE.md                  # Guidance for Claude Code agents
└── astro.config.ts            # Astro configuration
```

## Content Management

### Adding Blog Posts

Blog posts are MDX files in `src/content/posts/` using the naming convention `YYYY-MM-DD-slug.mdx`.

**Required frontmatter:**

```yaml
---
title: "Post Title"
description: "Brief description for SEO and cards"
author: "Author Name"
pubDatetime: 2025-01-15T00:00:00Z
slug: post-slug
tags: [tag1, tag2]
featured: false
draft: false
---
```

For detailed instructions, see [Adding New Posts](src/content/posts/examples/adding-new-post.md).

### Reference posts (`examples/` and `_releases/`)

`src/content/posts/examples/` and `src/content/posts/_releases/` hold the stock AstroPaper demo posts (how-to guides, color-scheme references, theme release notes). They are **kept intentionally** as living documentation: every file is `draft: true`, so they are excluded from the production build and never routed — but they stay in the repo as worked examples of theme features, including ones this site hasn't adopted yet (e.g. code-block rendering, callouts, advanced typography). If we enable such a feature later, the example is already here to crib from. Leave them drafted; don't delete them.

### Using the CMS

Access the CMS at `/admin/`. The CMS uses a draft workflow:

- Changes are committed to the `draft` branch
- Merge to `main` for production deployment

### Custom Components

**GameEmbed**: Embed Arcweave interactive games in posts:

```mdx
<GameEmbed
  src="https://arcweave.com/play/abc123"
  poster="/assets/game-poster.webp"
/>
```

## Commands

| Command             | Action                                                                                                                |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Start dev server at `localhost:4321`                                                                                  |
| `pnpm build`        | Type check, build site, generate search index                                                                         |
| `pnpm preview`      | Preview production build locally                                                                                      |
| `pnpm format`       | Format code with Prettier                                                                                             |
| `pnpm format:check` | Check code formatting                                                                                                 |
| `pnpm lint`         | Run ESLint                                                                                                            |
| `pnpm sync`         | Generate TypeScript types for Astro modules ([docs](https://docs.astro.build/en/reference/cli-reference/#astro-sync)) |

## Updating Dependencies

### Update npm Packages

```bash
# Check for outdated packages
pnpm outdated

# Bump explicit packages (preferred — avoids accidental majors)
pnpm update --latest <pkg-1> <pkg-2> ...

# Update within current semver ranges (safest)
pnpm update
```

**Held majors / packages — do not bump without verification:**

- We track **Astro 6** (matching the upstream theme), not Astro 7. The only
  majors still held are **Astro 7** and **`sharp` 0.35** (native image backend —
  validate on the Vercel Linux build). ESLint 10, TypeScript 6, and `googleapis`
  173 are applied. See the latest [maintenance plan](docs/plans/) for revisit
  triggers.
- `cpx2` was previously pinned to exact `8.0.0` to dodge an `ERR_REQUIRE_ESM`
  regression. `cpx2@9` migrated to ESM and fixed it, so it is now `^9.0.0` —
  do not re-pin.
- Astro 6 requires **Node 22.12+** (enforced via `engines`); keep Vercel's
  build Node version at 22+.

For detailed guidance, see [How to Update Dependencies](src/content/posts/examples/how-to-update-dependencies.md)
and the latest [maintenance plan](docs/plans/) for held items and revisit triggers.

### Update AstroPaper Theme

This site is based on [AstroPaper](https://github.com/satnaing/astro-paper) with an `upstream` remote configured:

```bash
# Verify remotes
git remote -v
# origin    https://github.com/gwsig-tech/game-writing.com.git
# upstream  https://github.com/satnaing/astro-paper.git

# If upstream is missing, add it:
git remote add upstream https://github.com/satnaing/astro-paper.git
```

**We're on AstroPaper v6 parity** (migrated 2026-06-28 from v5.5.1). Our structure
now matches upstream's v6 — three-file config, `src/i18n/`, `posts` collection at
`src/content/posts`, 7-token `theme.css`, `Layout`/`PostLayout` head-slot split.

**Still never `git pull` or `cherry-pick` from upstream** — the histories are
unrelated and a merge would clobber our customizations. But porting is now *cheap*:
because the structure matches, you diff the one upstream file you care about and
re-graft it by hand, preserving our customizations (jobs board, events, GameEmbed,
custom Header/Footer, palette, Vercel analytics, `/jams` redirect, static OG).

**To review upstream for ideas to port:**

```bash
# Fetch latest changes
git fetch upstream

# Check what's new (read for ideas; do not merge)
git log upstream/main --oneline -20

# Inspect how upstream configures something on Astro 6+, e.g. its config:
git show upstream/main:astro.config.ts
```

**Resources:**

- [AstroPaper Releases](https://github.com/satnaing/astro-paper/releases)
- [Compare versions](https://github.com/satnaing/astro-paper/compare/v6.1.0...main) (current base: v6.1.0)
- [Release Notes](src/content/posts/_releases/) (local copies)

**Most heavily-customized files** (preserve these when porting any upstream idea by hand):

- `src/layouts/Layout.astro` (Vercel analytics + WebSite/WebPage JSON-LD + theme/FOUC), `DefaultLayout`, `Main`; the post route `src/pages/posts/[...slug]/index.astro` (GameEmbed)
- `src/components/Header.astro` + `Footer.astro` — custom nav (About/Events/Constitution/Posts/Tags/Jobs) + SIG footer
- `astro-paper.config.ts` — site settings, social/share links, feature flags
- `src/styles/theme.css` — custom light/dark 7-token palette (styling follows [docs/theme-conformance.md](docs/theme-conformance.md))
- `src/pages/jobs.astro` + `src/lib/jobs.ts`, `src/pages/events.astro`, `public/admin/config.yml` — the jobs board, Google Calendar, and Sveltia CMS

The v6 migration is recorded in [docs/plans/2026-06-28-astropaper-v6-parity-migration.md](docs/plans/2026-06-28-astropaper-v6-parity-migration.md); deferred follow-ups (example-post refresh, OG-generator modernization, lightbox, etc.) are in [docs/plans/2026-06-28-astropaper-v6-backlog.md](docs/plans/2026-06-28-astropaper-v6-backlog.md).

## Tech Stack

| Category   | Technology                                                                              |
| :--------- | :-------------------------------------------------------------------------------------- |
| Framework  | [Astro](https://astro.build/) v6.4.8                                                    |
| Theme      | [AstroPaper](https://github.com/satnaing/astro-paper) v6 (parity, 2026-06-28)           |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) v4                                             |
| CMS        | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (loaded unpinned — always latest) |
| Search     | [Pagefind](https://pagefind.app/)                                                       |
| Icons      | [Tabler Icons](https://tabler-icons.io/)                                                |
| OG Images  | [Satori](https://github.com/vercel/satori) + Resvg                                      |
| Deployment | [Vercel](https://vercel.com/)                                                           |

## Documentation

### Internal (in this repo)

- [Theme Conformance Guide](docs/theme-conformance.md) — the standard for consistent, easy-to-re-theme styling (borders not shadows, `text-muted-foreground` for secondary text, 7 color tokens via utilities); includes a copy-pasteable per-page audit rubric
- [Adding New Posts](src/content/posts/examples/adding-new-post.md)
- [How to Configure AstroPaper](src/content/posts/examples/how-to-configure-astropaper-theme.md)
- [Customizing Color Schemes](src/content/posts/examples/customizing-astropaper-theme-color-schemes.md)
- [Predefined Color Schemes](src/content/posts/examples/predefined-color-schemes.md)
- [Dynamic OG Images](src/content/posts/examples/dynamic-og-images.md)
- [How to Update Dependencies](src/content/posts/examples/how-to-update-dependencies.md)
- [AstroPaper v6 Release Notes](src/content/posts/_releases/astro-paper-6.md)

### External

- [Astro Documentation](https://docs.astro.build/)
- [AstroPaper Demo & Blog](https://astro-paper.pages.dev/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Sveltia CMS Documentation](https://github.com/sveltia/sveltia-cms)

## License

Licensed under the MIT License.

---

Based on [AstroPaper](https://github.com/satnaing/astro-paper) by [Sat Naing](https://satnaing.dev/).
