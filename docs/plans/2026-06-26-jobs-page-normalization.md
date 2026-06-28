# Jobs-page normalization + sitewide JSON-LD fix — June 2026

**Date:** 2026-06-26
**Branch:** `narrative-job-board-jm` (continues the jobs work)
**Status:** Partially executed (shell + a11y fixes landed). **Two styling decisions below are SUPERSEDED** — see the update note.

> **Update (2026-06-27): superseded in part by [2026-06-27-jobs-theme-conformance.md](./2026-06-27-jobs-theme-conformance.md).**
> The shell + a11y fixes here (Main layout, `id="main-content"`, Breadcrumb, monospace removal) were correct and have landed — keep them. But two **styling** decisions in this plan *codified departures* from AstroPaper's flat/minimal design language and are now **reversed**:
> 1. "Keep the jobs-board _paper look_" (drop shadow + inset double border) → **flattened** to a plain bordered card (the site separates with borders, not depth; the foreground-derived shadow also inverted to a white halo in dark mode).
> 2. "Keep the custom filter tokens `--jobs-muted/subtle/border/panel/panel-strong/hover/shadow`" (rationale: "color-mix blends with no theme equivalent") → **removed**; re-expressed via sanctioned primitives (opacity for dim text, `bg-muted` for surfaces, `border-border`, no shadow). "No theme equivalent" was the tell that these were inventions outside the contract, not a reason to keep them.
>
> The conformance policy + reusable audit rubric now live at [../theme-conformance.md](../theme-conformance.md).

## Context

[src/pages/jobs.astro](../../src/pages/jobs.astro) is the **only** page that builds
its own bespoke shell instead of the theme's reusable patterns, and it reinvents
some theme tokens. An audit of every route confirms everything else is already
canonical, so left alone the jobs page is a template for future fragmentation.
Separately, [src/layouts/Layout.astro](../../src/layouts/Layout.astro) emits **one
hardcoded `BlogPosting` JSON-LD for every page**, producing
`datePublished:"undefined"` and the wrong `@type` on all non-post routes (this is
the issue tracked in
[2026-06-26-sitewide-jsonld-normalization.md](./2026-06-26-sitewide-jsonld-normalization.md)).
We normalize the jobs page's shell + CSS and fix the JSON-LD in the same sweep.

**Decisions:** keep the filter UI inline (no component extraction); keep the
jobs-board look (paper box, heading scale); JSON-LD = guard + neutral default.

## Audit result — only `jobs.astro` diverges

| Pattern | Pages |
|---|---|
| **2a** markdown → `layout: AboutLayout.astro` | `about.md`, `constitution.md`, `survey.mdx`, `jams/2025-arcjam.mdx` |
| **2b** `Layout` + `Header` + **`Main`** (Breadcrumb + `<main id="main-content" class="app-layout">` + h1) | `search`, `posts/[...page]`, `archives`, `tags/*` |
| **1** `Layout` + `Header` + `<main id="main-content">` (+ `Breadcrumb`) + `Footer` | `index`, `events`, `404` |
| **post** `PostDetails` (passes `pubDatetime` → valid `BlogPosting`) | `posts/[...slug]` |
| **outlier** bespoke `<main class="jobs-page max-w-6xl">` (no `id="main-content"`, no Breadcrumb, monospace re-declare, alias tokens) | **`jobs.astro`** |

## Workstream A — `jobs.astro` (shell + CSS cleanup; keep the look)

**Kept:** the filter sidebar + ~177-line filter `<script>`, `JobCard`, the
`.jobs-paper` box, the heading scale, and the wider `max-w-6xl` canvas (functional —
18rem sidebar + list grid; the site `max-w-3xl` standard is too narrow).

**Changes (all in `src/pages/jobs.astro`):**
1. Add `id="main-content"` to `<main>` — fixes the broken skip-to-content link
   (`Header.astro` targets `#main-content`). [a11y]
2. Add `<Breadcrumb />` between `<Header/>` and `<main>` (the `events.astro` pattern).
3. Remove the `font-family: ui-monospace, …` re-declaration — redundant; the whole
   site is already `font-mono` (`global.css` `body`).
4. Drop the alias tokens `--jobs-surface`/`--jobs-ink`; use `var(--background)` /
   `var(--foreground)` directly. (`JobCard.astro` uses `var(--jobs-ink,
   var(--foreground))` fallbacks → unaffected.)
5. Keep the genuinely-custom filter tokens (`--jobs-muted/subtle/border/panel/
   panel-strong/hover/shadow`) — `color-mix()` blends with no theme equivalent.

## Workstream B — sitewide JSON-LD (`src/layouts/Layout.astro` only)

Conditional `structuredData` from existing props:
- `pubDatetime` present (posts) → `BlogPosting`, `datePublished:
  pubDatetime.toISOString()` (guarded), `dateModified`/`author` as today.
- homepage (`Astro.url.pathname === "/"`) → `WebSite { name, description, url }`.
- everything else → `WebPage { name, description, url }`.

Injection unchanged. No page edits — `PostDetails` already passes `pubDatetime`.

## Verification

```bash
pnpm build && pnpm lint
```
- grep `dist/`: no `"datePublished":"undefined"`; `BlogPosting` only under
  `dist/posts/**`; `WebSite` in `dist/index.html`; `WebPage` in `dist/jobs/` etc.
- `/jobs`: unchanged visually; `<main id="main-content">` (skip link works) + breadcrumb.

## Out of scope
- No component extraction; filter UI stays inline.
- Jobs page intentionally wider than the 3xl site standard.
- Richer per-page schema (jobs `CollectionPage`, per-listing `JobPosting`) deferred —
  see [2026-06-26-job-posting-structured-data.md](./2026-06-26-job-posting-structured-data.md).
