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
