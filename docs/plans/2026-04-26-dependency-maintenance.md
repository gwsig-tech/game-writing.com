# Dependency Maintenance — April 2026

**Date:** 2026-04-26
**Branch:** `draft` (not yet merged to `main`)
**Author:** Jon

## Summary

Bumped safe minor/patch dependencies and cherry-picked two low-risk upstream
improvements from the AstroPaper theme. Held all major version bumps pending
either upstream validation or ecosystem stabilization.

## What changed

### Phase 1 — Safe dependency bumps (commit `936d990`)

Patch and low-risk minor bumps. No behavior changes expected.

| Package | From | To |
|---|---|---|
| `@astrojs/rss` | 4.0.14 | 4.0.18 |
| `@astrojs/sitemap` | 3.6.0 | 3.7.2 |
| `@astrojs/check` (dev) | 0.9.6 | 0.9.8 |
| `dayjs` | 1.11.19 | 1.11.20 |
| `tailwindcss` + `@tailwindcss/vite` | 4.1.18 | 4.2.4 |
| `pagefind` + `@pagefind/default-ui` (dev) | 1.4.0 | 1.5.2 |
| `prettier` (dev) | 3.7.4 | 3.8.3 |
| `prettier-plugin-tailwindcss` (dev) | 0.7.2 | 0.7.3 |
| `@typescript-eslint/parser` + `typescript-eslint` (dev) | 8.51.0 | 8.59.0 |
| `eslint-plugin-astro` (dev) | 1.5.0 | 1.7.0 |
| `globals` (dev) | 17.0.0 | 17.5.0 |

### Phase 2 — Upstream cherry-picks

Cherry-picked from `satnaing/astro-paper` upstream (instead of merging, because
our fork has heavily diverged: 134 files changed, +4996/-1355).

- **`f794090`** — `5bb8e40` upstream: theme script refactor. Moved from
  `public/toggle-theme.js` to `src/scripts/theme.ts`. Splits into a minimal
  inline FOUC-prevention script + non-blocking external script. Renamed
  `primaryColorScheme` to `initialColorScheme`. Added `src/env.d.ts` for the
  `window.theme` type.
- **`d55ff96`** — `c61a755` upstream: search bar autofocus + result title
  styling.

## Decisions and rationale

### Held: `googleapis` 170 → 171

Powers the events calendar via Google Calendar API ([src/pages/events.astro](../../src/pages/events.astro)).
Major bump on a critical surface — skipped for safety. No reason to risk the
calendar for a routine bump.

### Pinned: `cpx2` to exact `8.0.0`

Bumping to 8.0.2 broke `pnpm build` with `ERR_REQUIRE_ESM` — cpx2 8.0.2
`require()`s `debounce`, but `debounce@3` is now ESM-only. Pinned to exact
`8.0.0` (not `^8.0.0`) so a fresh install can't pull the broken version.

**Unpin trigger:** when cpx2 8.0.3+ ships with the require fixed (or moves to
dynamic `import()`).

### Skipped: slugify cherry-pick (`fb63d96`)

Upstream's slugify fix changes how acronyms and numbers are tokenized
("E2E Testing" → "e2e-testing" instead of "e-2-e-testing"). Tag URLs are
build-time slugified, so existing tag links could change. Decided not worth
the URL churn for a niche fix.

### Held: all majors

| Package | From | To | Why held |
|---|---|---|---|
| `astro` | 5.16.6 | 6.1.9 | Major. Upstream theme's own dependabot PR (#629) is still open and unmerged |
| `@astrojs/mdx` | 4.3.13 | 5.0.4 | Coupled to Astro 6 |
| `@shikijs/transformers` (dev) | 3.20.0 | 4.0.2 | Major; affects code-block rendering |
| `@vercel/analytics` | 1.6.1 | 2.0.1 | Major; verify analytics still report after bump |
| `@vercel/speed-insights` | 1.3.1 | 2.0.0 | Major; same as above |
| `eslint` (dev) | 9.39.2 | 10.2.1 | Major; ecosystem may not be ready |
| `typescript` (dev) | 5.9.3 | 6.0.3 | TS 6 just released; touchy |
| `satori` | 0.18.3 | 0.26.0 | Big jump within 0.x; powers OG image generation |

## Pre-merge-to-main checklist

Before promoting `draft` → `main`, smoke-test on `preview.game-writing.com`:

- [ ] Theme toggle works (light ↔ dark) — most-changed surface
- [ ] No FOUC on first load (inline script should set theme before paint)
- [ ] Search bar autofocuses on `/search`
- [ ] Search result titles render correctly
- [ ] OG image generation works (open a blog post, share to social, verify card)
- [ ] Events calendar loads on `/events`
- [ ] Tailwind classes still apply correctly across pages (we bumped 4.1 → 4.2)
- [ ] Vercel build logs clean — no warnings about deprecated APIs
- [ ] Pagefind search index includes recent posts

## Forward-looking maintenance plan

### Watch for (revisit triggers)

1. **AstroPaper upstream Astro 6 PR** ([dependabot/npm_and_yarn/astro-6.1.6](https://github.com/satnaing/astro-paper/pull/629))
   — when this merges and ships in a tagged release, that's the green light to
   bump Astro + MDX here. Check monthly.
2. **cpx2 8.0.3+** — releases page on npm. Unpin when shipped.
3. **Vercel package v2 migration guides** — `@vercel/analytics` and
   `@vercel/speed-insights` are small libs but ship behavior changes. Read
   their changelogs before bumping.
4. **Satori 1.0** — currently 0.x; once it hits 1.0, do an OG image visual
   regression test before adopting.

### Suggested cadence

- **Monthly:** `pnpm outdated`, take patch+minor bumps, run build, visual smoke
  test on preview before merging to main.
- **Quarterly:** review upstream theme commits with
  `git log <last-merged-commit>..upstream/main --oneline`. Cherry-pick
  individual improvements; do NOT do a full upstream merge (the divergence is
  too large — see [Files likely to have conflicts](../../README.md#updating-dependencies)).
- **On any major bump:** test on a non-`draft` branch first, deploy to a Vercel
  preview, smoke-test, then merge.

### Things to avoid

- Don't `pnpm update --latest` without explicitly listing packages — easy to
  accidentally pull a major.
- Don't bump `googleapis` without testing the events calendar locally with
  real Google Calendar credentials in `.env`.
- Don't unpin `cpx2` without first verifying the new version doesn't have the
  ERR_REQUIRE_ESM regression.
