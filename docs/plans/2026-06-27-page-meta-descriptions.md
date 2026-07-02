# Page metadata: per-page descriptions + title/description model — June 2026

**Date:** 2026-06-27
**Branch:** `draft`
**Author:** Jon (with Claude)
**Status:** Done (code shipped) — this doc is the record of what changed and why, plus the carry-forward note for the v6 upgrade.

## Background — the two metadata layers (this is canonical AstroPaper, not our invention)

AstroPaper (and our fork) split page metadata across two layers that are wired **independently per page**:

- **`Layout.astro` → `title` / `description`** — the `<head>`: the browser-tab `<title>`, `<meta name="description">`, OG + Twitter cards, and the JSON-LD `WebPage`/`WebSite` description. Invisible on the page; this is the SEO/social layer. Defaults to `SITE.title` / `SITE.desc`.
- **`Main.astro` → `pageTitle` / `pageDesc`** — the **visible** on-page `<h1>` and the italic intro line beneath it. No effect on `<head>`.

We confirmed via a v5.5.1 baseline audit (see [2026-06-26-astropaper-v6-adoption.md](./2026-06-26-astropaper-v6-adoption.md) and the deviation audit) that this split — and the gap below — is **stock AstroPaper behavior**, inherited, not a deviation we introduced. AstroPaper v6 keeps the same two-layer split.

**`title` and `pageTitle` are separate fields,** set independently per page: `title` builds the `<head>` / browser-tab string, `pageTitle` is the visible `<h1>`. The theme treats them as distinct, so they *can* differ even though our pages currently keep them aligned — setting one does not set the other.

### The gap we closed (decision "C")

Stock AstroPaper hub/list pages (archives, tags, search, posts index) pass **only** `title` to `Layout` and never pass a `description`, so every hub page falls back to the single site-default `SITE.desc` ("The official site of the Game Writing SIG.") for its meta description, OG description, Twitter description, and JSON-LD. The good per-page copy that already exists as the visible `pageDesc` never reached the `<head>`. v6 has the **same** gap on its hub pages (only `about` and posts pass a real description).

## What changed (C)

Each page now **single-sources** its description: one string feeds both the visible intro (`Main` `pageDesc`) and the `<head>` (`Layout` `description`). Because it is one source, the visible subtitle and the meta description cannot drift.

- **7 `Main`-based pages** — `jobs`, `events`, `search`, `archives`, `posts/[...page]`, `tags/index`, `tags/[tag]/[...page]`: added `const pageDesc = "…"` (computed for the tag page) and passed it to **both** `<Main pageDesc={pageDesc}>` and `<Layout … description={pageDesc}>`. Two weak strings were improved in passing (`search` lost a trailing " …"; `archives` lost the first-person "I've archived").
- **`DefaultLayout.astro`** — its `MarkdownLayoutProps` type now accepts an optional `description`, forwarded to `Layout`. The 5 `.mdx` content pages (`about`, `constitution`, `terms`, `privacy`, `jams/2025-arcjam`) each gained a `description:` frontmatter line. Pages without one still fall back to `SITE.desc` via `Layout`'s default.

**Not touched:** `title` handling (still `` title={`X | ${SITE.title}`} `` per page — see decision B below), `index.astro` (home correctly uses `SITE.desc`), `404.astro`, and `PostDetails` (blog posts already wired `post.description`).

### Bonus: this also improves JSON-LD

`Layout` feeds `description` into the `WebPage`/`WebSite` structured-data block, so every hub/content page now emits a real per-page description in its JSON-LD too, not the site default.

## Decisions (the "B / C / D" from the title/description discussion)

- **C — per-page descriptions: DONE** (this doc). Real SEO/social benefit; forward-compatible with v6.
- **D — make `Main` own the `Layout`/`Header`/`Footer` shell: REJECTED.** v6 moves `Main` the **opposite** direction (a thinner *component*; page-level composition stays explicit). Restructuring `Main` now would build something the v6 port would tear out. Do not do this.
- **B — centralize the `` | ${SITE.title} `` title suffix in `Layout`: DEFERRED (leave as-is).** The suffix is currently hand-applied at each call site. Stock v5.5.1 **and** v6 both hand-apply it the same way, so centralizing it would be a net-new divergence from both, for marginal benefit, that the v6 port would discard. There is no active bug (the earlier `jobs` "Events" mistake was a wrong page *name*, which suffix-centralization would not have prevented). **Best revisited as a post-v6 follow-up** — do it on the v6 `Layout` after cutover so the work isn't thrown away (noted in the v6 adoption plan). **Note:** B ≠ the title-drift root cause. If we later want to harden against title drift, that is a separate, optional "derive/validate per page" change — but remember `title` and `pageTitle` are independent fields the theme allows to differ, so a blunt "derive `title` from `pageTitle`" shortcut isn't always safe.

## Cleanups shipped alongside (both verified as inherited stock cruft, not ours)

1. **Removed the dead `<h1 slot="title">`** in `tags/[tag]/[...page].astro`. It targeted a named slot `Main` never defines, so it silently dropped a redundant heading into the body. Byte-identical to v5.5.1 — an inherited upstream artifact.
2. **Deleted `src/pages/og.png.ts`** (the dynamic site-OG-card route). It rendered an `/og.png` every build that nothing references, because `SITE.ogImage` is set so `Layout` always resolves OG to `/game-writing-og.jpg`. Pure build-time savings.
   - **Coupling note for future-us:** `Layout.astro`'s OG line is `` ogImage = SITE.ogImage ? `/${SITE.ogImage}` : "/og.png" ``. With the route deleted, the `: "/og.png"` branch is **dead** — it is only reachable if `SITE.ogImage` is ever cleared. If you clear `SITE.ogImage`, either restore an `og.png` route or point that fallback at an existing static image. `generateOgImageForSite()` in `src/utils/generateOgImages.ts` is now unused but left in place (its sibling `generateOgImageForPost` still backs the per-post `index.png.ts` path when `dynamicOgImage` is enabled).

## Carry-forward note for the v6 upgrade (IMPORTANT — do not lose this)

When executing [2026-06-26-astropaper-v6-adoption.md](./2026-06-26-astropaper-v6-adoption.md), the per-page descriptions are a **custom behavior to re-port**, because v6's stock hub pages do **not** have them:

- **P3 (Layouts + head plumbing):** on each hub page, pass the page's description into v6's `Layout` `description` prop (single-sourced from the same value as `Main`'s `pageDesc`, i.e. the relevant `t.pages.*Desc` i18n key). v6 already centralizes the strings in `src/i18n/lang/en.ts`, so the natural v6 form is `description={t.pages.archivesDesc}` next to `pageTitle/pageDesc`.
- **P6d (`.mdx` content pages):** carry the `description:` frontmatter through whatever `DefaultLayout` shim replaces ours (v6's `about` already passes `about.data.description`).
- **og.png:** `src/pages/og.png.ts` was removed here. v6 ships its own `og.png.ts`; the v6 plan's smoke matrix line "OG (`/og.png`)" applies to the v6 scaffold, not to our (now-deleted) route. Decide per `dynamicOgImage` whether v6 should keep the site-card route at all.

## Files touched

- Pages: `src/pages/{jobs,events,search}.astro`, `src/pages/archives/index.astro`, `src/pages/posts/[...page].astro`, `src/pages/tags/index.astro`, `src/pages/tags/[tag]/[...page].astro`
- Layout: `src/layouts/DefaultLayout.astro`
- Content frontmatter: `src/pages/{about,constitution,terms,privacy}.mdx`, `src/pages/jams/2025-arcjam.mdx`
- Deleted: `src/pages/og.png.ts`