# IGDA Game Writing SIG Website

Website for the [IGDA Game Writing Special Interest Group](https://game-writing.com).

Built with [Astro](https://astro.build/) using the [AstroPaper](https://github.com/satnaing/astro-paper) theme (v5.5.1), styled with [Tailwind CSS](https://tailwindcss.com/), and managed via [Sveltia CMS](https://github.com/sveltia/sveltia-cms).

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

Environment variables are declared with a typed schema in [`astro.config.ts`](astro.config.ts) (Astro's `env` / `envField`). Set them in a local `.env` file (gitignored) for development, and as **Vercel Environment Variables** for preview/production builds.

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
│   ├── data/
│   │   ├── blog/
│   │   │   ├── YYYY-MM-DD-slug.mdx  # Blog posts
│   │   │   ├── examples/      # AstroPaper documentation (drafts)
│   │   │   ├── _releases/     # AstroPaper release notes (drafts)
│   │   │   ├── _events/       # Event announcements
│   │   │   └── _spotlights/   # Member spotlights
│   │   └── jobs/              # [Custom] Jobs board source (job_postings.csv)
│   ├── layouts/
│   │   ├── Layout.astro       # [Modified] Base HTML layout + Vercel analytics + theme script + JSON-LD
│   │   ├── PostDetails.astro  # [Modified] Blog post layout + GameEmbed
│   │   ├── DefaultLayout.astro # [Custom] Default markdown/content page layout
│   │   └── Main.astro         # Main content wrapper (utility/hub pages)
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
│   │   ├── global.css         # Tailwind config + CSS variables
│   │   └── typography.css     # Prose/markdown styling
│   ├── utils/                 # Helper functions
│   ├── lib/                   # [Custom] Build-time libs (jobs.ts — CSV jobs board)
│   ├── config.ts              # Site configuration (URL, title, etc.)
│   ├── constants.ts           # Social links, sharing options
│   ├── content.config.ts      # Content collection schema
│   └── env.d.ts               # Ambient type declarations (window.theme)
├── CLAUDE.md                  # Guidance for Claude Code agents
└── astro.config.ts            # Astro configuration
```

## Content Management

### Adding Blog Posts

Blog posts are MDX files in `src/data/blog/` using the naming convention `YYYY-MM-DD-slug.mdx`.

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

For detailed instructions, see [Adding New Posts](src/data/blog/examples/adding-new-post.md).

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

For detailed guidance, see [How to Update Dependencies](src/data/blog/examples/how-to-update-dependencies.md)
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

**⚠️ Do NOT merge or cherry-pick from upstream anymore.** As of upstream's
`feat!: AstroPaper v6` (`f0b644d`), the theme is a ground-up rewrite (new i18n,
`BaseLayout`/`PostLayout` replacing `Layout.astro`, design tokens). Our fork has
diverged past the point where `git pull upstream main` or `git cherry-pick` is
safe — a merge would be destructive. Treat upstream as **reference only** and
port ideas by hand.

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
- [Compare versions](https://github.com/satnaing/astro-paper/compare/v5.5.1...main) (current base: v5.5.1)
- [Release Notes](src/data/blog/_releases/) (local copies)

**Most heavily-customized files** (preserve these when porting any upstream idea by hand):

- `src/layouts/` — `Layout` (Vercel analytics/speed-insights + conditional JSON-LD + theme script), `DefaultLayout`, `Main`, `PostDetails` (GameEmbed)
- `src/components/Header.astro` — custom nav (About/Events/Constitution/Posts/Tags/Jobs)
- `src/config.ts` / `src/constants.ts` — site settings, social/share links
- `src/styles/global.css` — custom light/dark palette + utilities
- `src/pages/jobs.astro` + `src/lib/jobs.ts`, `src/pages/events.astro`, `public/admin/config.yml` — the jobs board, Google Calendar, and Sveltia CMS

A full adoption of upstream's AstroPaper **v6** rewrite is scoped (and deliberately deferred) in [docs/plans/2026-06-26-astropaper-v6-adoption.md](docs/plans/2026-06-26-astropaper-v6-adoption.md).

## Tech Stack

| Category   | Technology                                                                              |
| :--------- | :-------------------------------------------------------------------------------------- |
| Framework  | [Astro](https://astro.build/) v6.4.8                                                    |
| Theme      | [AstroPaper](https://github.com/satnaing/astro-paper) v5.5.1                            |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) v4                                             |
| CMS        | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (loaded unpinned — always latest) |
| Search     | [Pagefind](https://pagefind.app/)                                                       |
| Icons      | [Tabler Icons](https://tabler-icons.io/)                                                |
| OG Images  | [Satori](https://github.com/vercel/satori) + Resvg                                      |
| Deployment | [Vercel](https://vercel.com/)                                                           |

## Documentation

### Internal (in this repo)

- [Adding New Posts](src/data/blog/examples/adding-new-post.md)
- [How to Configure AstroPaper](src/data/blog/examples/how-to-configure-astropaper-theme.md)
- [Customizing Color Schemes](src/data/blog/examples/customizing-astropaper-theme-color-schemes.md)
- [Predefined Color Schemes](src/data/blog/examples/predefined-color-schemes.md)
- [Dynamic OG Images](src/data/blog/examples/dynamic-og-images.md)
- [How to Update Dependencies](src/data/blog/examples/how-to-update-dependencies.md)
- [AstroPaper v5 Release Notes](src/data/blog/_releases/astro-paper-5.md)

### External

- [Astro Documentation](https://docs.astro.build/)
- [AstroPaper Demo & Blog](https://astro-paper.pages.dev/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Sveltia CMS Documentation](https://github.com/sveltia/sveltia-cms)

## License

Licensed under the MIT License.

---

Based on [AstroPaper](https://github.com/satnaing/astro-paper) by [Sat Naing](https://satnaing.dev/).
