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

## Quick Start

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server at localhost:4321
pnpm build            # Build for production (includes search index)
pnpm preview          # Preview production build
```

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
│   │   ├── Header.astro       # [Modified] Custom navigation
│   │   ├── Card.astro         # Blog post cards
│   │   ├── Datetime.astro     # Date/time display
│   │   ├── Tag.astro          # Tag links
│   │   └── ...                # Other AstroPaper components
│   ├── data/
│   │   └── blog/
│   │       ├── YYYY-MM-DD-slug.mdx  # Blog posts
│   │       ├── examples/      # AstroPaper documentation (drafts)
│   │       ├── _releases/     # AstroPaper release notes (drafts)
│   │       ├── _events/       # Event announcements
│   │       └── _spotlights/   # Member spotlights
│   ├── layouts/
│   │   ├── Layout.astro       # [Modified] Base HTML layout + Vercel analytics + theme script
│   │   ├── PostDetails.astro  # [Modified] Blog post layout + GameEmbed
│   │   ├── AboutLayout.astro  # [Custom] Static page layout
│   │   └── Main.astro         # Main content wrapper
│   ├── pages/
│   │   ├── index.astro        # Homepage
│   │   ├── about.md           # About page
│   │   ├── constitution.md    # SIG constitution
│   │   ├── events.astro       # [Custom] Google Calendar integration
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

**Pinned packages — do not bump without verification:**

- `cpx2` is pinned to exact `8.0.0`. Versions 8.0.1 / 8.0.2 trigger
  `ERR_REQUIRE_ESM` during `pnpm build` because they `require()` `debounce@3`
  which is now ESM-only. Unpin when 8.0.3+ ships with the require fixed.

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

**To update from upstream:**

```bash
# Fetch latest changes
git fetch upstream

# Check what's new
git log upstream/main --oneline -10

# Create update branch
git checkout -b update/astropaper-vX.X.X

# Merge (expect conflicts with customized files)
git pull upstream main

# Resolve conflicts, test thoroughly, then merge to main
```

**Resources:**

- [AstroPaper Releases](https://github.com/satnaing/astro-paper/releases)
- [Compare versions](https://github.com/satnaing/astro-paper/compare/v5.5.1...main) (current base: v5.5.1)
- [Release Notes](src/data/blog/_releases/) (local copies)

**Files likely to have conflicts** (customized for this site):

- `src/components/Header.astro` - Custom navigation
- `src/layouts/Layout.astro` - Vercel analytics/speed-insights injection
- `src/layouts/PostDetails.astro` - GameEmbed integration
- `src/config.ts` - Site-specific settings
- `src/constants.ts` - Social links

**Files safe to update** (minimal or no customization):

- `src/utils/` - Helper functions
- `src/styles/` - Global styles (minor customizations to section/footer)
- Most components in `src/components/`

> **Recommendation:** the fork has heavily diverged from upstream. Prefer
> cherry-picking specific upstream commits over a full merge. See
> [docs/plans/](docs/plans/) for prior maintenance notes and decisions.

## Tech Stack

| Category   | Technology                                                   |
| :--------- | :----------------------------------------------------------- |
| Framework  | [Astro](https://astro.build/) v5.16.6                        |
| Theme      | [AstroPaper](https://github.com/satnaing/astro-paper) v5.5.1 |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) v4                  |
| CMS        | [Sveltia CMS](https://github.com/sveltia/sveltia-cms)        |
| Search     | [Pagefind](https://pagefind.app/)                            |
| Icons      | [Tabler Icons](https://tabler-icons.io/)                     |
| OG Images  | [Satori](https://github.com/vercel/satori) + Resvg           |
| Deployment | [Vercel](https://vercel.com/)                                |

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
