# Site-wide JSON-LD normalization — fix the hardcoded `BlogPosting` on non-post pages

**Date:** 2026-06-26
**Branch:** TBD (small, isolated; can ride along with the jobs reintegration or stand alone)
**Author:** Jon (with Claude)
**Status:** Planned — ready to execute. Low risk.

## Context

Every page on the site renders through [src/layouts/Layout.astro](../../src/layouts/Layout.astro), which builds **one hardcoded structured-data object** and injects it as JSON-LD into `<head>`:

```ts
// src/layouts/Layout.astro (lines ~34–48)
const structuredData = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: `${title}`,
  image: `${socialImageURL}`,
  datePublished: `${pubDatetime?.toISOString()}`,
  ...(modDatetime && { dateModified: modDatetime.toISOString() }),
  author: [ { "@type": "Person", name: `${author}`, ... } ],
};
```

Only individual blog posts pass `pubDatetime`/`modDatetime` (via [src/layouts/PostDetails.astro](../../src/layouts/PostDetails.astro), which spreads them into `Layout`). **Every other route** — home, `/jobs`, `/events`, `/about`, `/constitution`, `/search`, `/tags`, `/archives`, `/posts` listing, `404` — renders `Layout` **without** those props, so it emits:

- the wrong `@type` (`BlogPosting`) for pages that are not articles (a jobs board, an events list, a search page, the homepage…), and
- a literally invalid field: `datePublished: "undefined"` (template-string interpolation of `undefined?.toISOString()` → the string `"undefined"`).

This is a cross-site structured-data **correctness and consistency** issue. It does not affect rendering, but every crawler sees malformed markup site-wide. It is **independent of** the jobs data-normalization work (see [2026-06-26-job-posting-structured-data.md](./2026-06-26-job-posting-structured-data.md)); fixing it here keeps that doc focused on the data layer.

## Approach

Make `Layout`'s structured data appropriate to the page instead of always `BlogPosting`:

1. **Emit `BlogPosting` only when it's actually an article** — i.e. when `pubDatetime` is present. Guard the field so `datePublished` is never `"undefined"`.
2. **For non-article pages**, emit a neutral type (e.g. `WebSite` for the homepage / `WebPage` elsewhere) or omit structured data entirely. Either is valid; pick one and apply consistently.
3. **(Optional, future-friendly)** accept an optional prop on `Layout` — e.g. `structuredData?: object | null` (or a `pageType`) — so a route can supply its own JSON-LD or opt out. This is also the hook a future `/jobs` `CollectionPage` would use, but that is **not required** for this fix.

Keep the existing correct behavior for real posts: `PostDetails` continues to pass `pubDatetime`/`modDatetime`, so posts still serialize a valid `BlogPosting`.

## Critical files

- [src/layouts/Layout.astro](../../src/layouts/Layout.astro) — gate/parameterize the `structuredData` object (lines ~34–48 build it; lines ~107–112 inject it).
- [src/layouts/PostDetails.astro](../../src/layouts/PostDetails.astro) — no change required; it already passes the date props that should drive `BlogPosting`.

## Verification

```bash
pnpm build
```

- `view-source` (or grep the built HTML in `dist/`) across representative routes: confirm **no** `"datePublished":"undefined"` anywhere, and that `BlogPosting` appears **only** on real post pages.
- Run Google's [Rich Results Test](https://search.google.com/test/rich-results) and/or the [schema.org validator](https://validator.schema.org/) on a couple of built pages (one post, one non-post): no structured-data errors; post still validates as `BlogPosting`.
- Spot-check that `og:`/`twitter:` meta and the rest of `<head>` are unchanged.
