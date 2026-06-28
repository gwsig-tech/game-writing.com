# AstroPaper v6 — post-migration backlog (2026-06-28)

**Context:** the v6 parity migration (P0–P7) is **complete** on `jm-astropaper-v6` — see [2026-06-28-astropaper-v6-parity-migration.md](./2026-06-28-astropaper-v6-parity-migration.md) for the as-built record. The items below were **intentionally deferred**; **none block merging to `draft`**. They're roughly ordered by value/effort. Pick any up independently in the `jm-astropaper-v6` worktree (or a fresh one off `draft`).

---

## 1. Example / reference post refresh (content task)

- **What:** our `src/content/posts/examples/` posts are still the v5.5.1-era versions. v6 rewrote them (MD→MDX, `<ResponsiveTable>`, callouts, new-config docs). The v6 **release post `_releases/astro-paper-6.md` was pulled**; the 10 examples were **not**.
- **Why deferred:** each upstream example references v6 demo images — ~13 assets across **4 path conventions** (`@/assets`, `../../assets`, `assets/`, `/assets`) — and needs per-post review (several document stock v6's 7-token palette, which differs from ours). It's a content task, not a mechanical pull, and a sloppy pull breaks the build (missing-image schema errors, even for drafts).
- **How:** pull each example from `upstream/main` (paths listed in the migration doc's *Content sync* section), pull its referenced images to the matching relative locations, set `draft: true`, then `pnpm build` + confirm routes unchanged. `ResponsiveTable` is already registered in the post `<Content components>`; `rehype-callouts` is already wired — so the pulled MDX will render correctly.
- **Effort:** ~0.5–1d (content).

## 2. OG image generator modernization (resvg → sharp)

- **What:** the dynamic-OG generator (`src/utils/og-templates/*`, `loadGoogleFont.ts`, `generateOgImages.ts`, dep `@resvg/resvg-js` + its `optimizeDeps.exclude`) is still the v5 resvg pipeline.
- **Why deferred:** it's **dormant** — `features.dynamicOgImage: false`, so `posts/[...slug]/index.png.ts` `getStaticPaths` returns `[]` and the generator never runs (no build-time Google-Fonts fetch while off). Zero functional impact; OG is static (per-post `ogImage` + the site logo fallback).
- **How:** adopt v6's sharp generator + `getFontPathByWeight` + a self-hosted `fonts` block, drop `@resvg/resvg-js`; **or** strip the dormant generator entirely and re-add from upstream if dynamic OG is ever wanted. Keep `dynamicOgImage: false` either way unless we decide to enable it.
- **Effort:** ~0.5d.

## 3. Image lightbox (click-to-zoom on post images)

- **What:** v6 adds an accessible click-to-zoom (`img[role="button"]` + `cursor-zoom-in` + a dialog script in `posts/[...slug]/index.astro`, plus typography styling).
- **Why deferred:** non-essential enhancement; unrelated to image optimization (which is unchanged and already WebP).
- **How:** port v6's lightbox script + the `img[role="button"]` typography rules into our `posts/[...slug]/index.astro`.
- **Effort:** ~0.25d.

## 4. `getPath` → `getPostSlug` / `getPostUrl` split

- **What:** we kept `src/utils/getPath.ts`. v6 splits it into `getPostSlug` (route param) + `getPostUrl` (navigable, locale-aware) in `getPostPaths.ts`.
- **Why deferred:** **not needed for URL parity** — `getPath` produces identical `/posts/<slug>`. The split's payoff is locale-aware URLs, and we're single-locale at the domain root.
- **How:** adopt v6's `getPostPaths.ts` (adapt to `config.site.lang`); update call sites (`Card`, `index`, `tags/*`, `rss.xml.ts`, `_components/AdjacentPostNav`, the post route); verify the built route set is still identical to production.
- **Effort:** ~0.25–0.5d.

## 5. v6 `theme.ts` + `.dark` class toggle

- **What:** we kept our `src/scripts/theme.ts` (`data-theme` + `window.theme`, wires **both** `#theme-btn` and `#theme-btn-mobile`). v6 uses `window.__theme` + an additive `.dark` class + a single `#theme-btn`.
- **Why deferred:** v6's single-button `theme.ts` doesn't wire our **mobile** theme button, and our `@custom-variant dark` already keys on `[data-theme=dark]` (identical to v6) — so there's no functional gap.
- **How:** adopt v6's `theme.ts` + FOUC but extend it to wire both buttons (or collapse the Header to a single theme button); update `src/env.d.ts` (`window.theme` → `window.__theme`).
- **Effort:** ~0.25d (couples to a Header re-skin if you go that way).

## 6. Component alignment — Header / Footer / Breadcrumb / Tag / LinkButton

- **What / why kept:** these stayed **custom**. They've diverged substantially from v6 (Breadcrumb ~155, Tag ~74, Footer ~62, LinkButton ~42 changed lines) for SIG-specific reasons; adopting v6 verbatim would **erase intentional customizations** (the 6-item nav, SIG footer, etc.). Per the "keep our customizations" principle, we kept them; they conform to AstroPaper's flat/minimal language.
- **How (if desired):** selectively graft v6 structural improvements while preserving our nav/content. Low priority — not merge-blocking, and these files rarely change upstream.

## 7. `SeoJsonLd` extraction (optional structural parity)

- **What / why kept inline:** our richer `WebSite`/`WebPage` JSON-LD lives inside `Layout.astro` (gated to non-article pages so there's no double-emit with `PostLayout`'s `BlogPosting`). v6's pattern would be a separate `SeoJsonLd.astro` injected per hub page via the head slot. We kept it inline: **same output, zero per-page churn, and richer than v6** (v6 ships no hub-page structured data).
- **How (if desired):** extract to `SeoJsonLd.astro`. Low value.

## 8. `withBase` / URL-helper layer

- **What / why deferred:** v6's `withBase`/`getAssetPath` + locale-aware URL helpers are **no-ops** at the domain root with a single locale.
- **How:** adopt only if a non-empty base path or a second locale is ever introduced.

## 9. Operational / config follow-ups

- **CI activation:** [.github/workflows/ci.yml](../../.github/workflows/ci.yml) is `workflow_dispatch` (manual-only) on purpose — Vercel already builds deploys. To make it a PR gate (adds `lint` + `format:check`), add the `pull_request` trigger noted in the file.
- **`pnpm-workspace`:** kept `onlyBuiltDependencies` (pnpm-10 syntax). Migrate to `allowBuilds` only when/if the repo moves to pnpm 11.
- **Vercel env scope:** make sure `GOOGLE_CALENDAR_API_KEY` is set for the **Preview** environment, not just Production — otherwise `/events` shows "not configured" on previews. (For local dev/build in a worktree, copy `.env` in — it's gitignored, so it isn't carried into `.worktrees/`.)
- **Formatting:** `pnpm format:check` reports pre-existing style issues across the repo (predates this migration). Per the "never whole-repo format" convention, left untouched; format deliberately if/when wanted.
- **Decision B (pre-existing):** centralizing the `` | ${config.site.title} `` title suffix into `Layout` is still deferred — see [2026-06-27-page-meta-descriptions.md](./2026-06-27-page-meta-descriptions.md).

## 10. Next major — AstroPaper v7 / Astro 7

Upstream is at **v6.1.0**; **no v7 exists yet**. When upstream ships v7 (likely paired with **Astro 7** — the held major we're tracking), that's the next theme upgrade. Now that we're on v6 structure, future upstream pulls are far cheaper: diff `upstream/main`, port new components/config, and re-graft our customizations (jobs, events, GameEmbed, custom Header/Footer, palette). See the "Update AstroPaper Theme" section in `README.md`.
