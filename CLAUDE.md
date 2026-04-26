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

### Configuration

- **Site settings**: `src/config.ts` (site URL, author, title, etc.)
- **Social links**: `src/constants.ts` (SOCIALS and SHARE_LINKS arrays)

### CMS

- **Sveltia CMS**: `public/admin/` with config.yml and custom editor components
- **Draft workflow**: CMS commits to `draft` branch, merged to `main` for production
- **GameEmbed component**: Custom MDX component for embedding Arcweave games

### Key Directories

- `src/components/` - Astro components (Card, Header, Datetime, etc.)
- `src/layouts/` - Page layouts (Layout, PostDetails, AboutLayout)
- `src/pages/` - Route pages including static pages like about.md, constitution.md
- `src/utils/` - Helper functions for posts, tags, OG images
- `src/assets/` - Images and icons (also used as CMS media folder)

### Build Output

- Pagefind search index generated during build and copied to `public/pagefind/`
- Static site output to `dist/`

### Theme System

- Theme toggle logic lives in `src/scripts/theme.ts` (loaded non-blocking)
- A minimal inline FOUC-prevention script in `src/layouts/Layout.astro` sets the theme before paint
- `window.theme` types are declared in `src/env.d.ts`

## Branch and Deploy Flow

- `main` → production (game-writing.com)
- `draft` → preview (preview.game-writing.com via Vercel)
- Sveltia CMS commits to `draft`; merge to `main` for production
- Feature branches → PR into `main` (or `draft` for preview deploys)

## Upstream Theme

- `upstream` remote points to `satnaing/astro-paper`
- Fork has heavily diverged — prefer cherry-picking specific commits over a full merge
- See `docs/plans/` for maintenance history and decisions

## Pinned Dependencies (do not bump without checking)

- `cpx2` is pinned to exact `8.0.0`. Versions 8.0.1 / 8.0.2 break the build with `ERR_REQUIRE_ESM` (require of ESM-only `debounce@3`).
- See the latest plan in `docs/plans/` for the full list of held majors and their revisit triggers.

## Claude Code Settings

- `.claude/settings.local.json` is per-user (gitignored) — for local permission grants only
- Project-wide Claude Code settings (if any) belong in `.claude/settings.json` (committed)
