# AstroPaper v6 — full-parity migration plan (2026-06-28)

**Supersedes** [`2026-06-26-astropaper-v6-adoption.md`](./2026-06-26-astropaper-v6-adoption.md) (written before the recent conformance + meta work, now stale). **Worktree:** `.worktrees/jm-astropaper-v6` (branch `jm-astropaper-v6`, off `draft`). **Status: ✅ COMPLETE (P0–P7), merge-ready.** See **[Execution outcome & deviations](#execution-outcome--deviations)** below for what actually shipped vs planned, and the **[backlog](./2026-06-28-astropaper-v6-backlog.md)** for everything deferred. The phased roadmap further down is the original plan, kept as the historical record.

> **Status: decisions resolved 2026-06-28** (see the Resolved Decisions section). Basis: a read-only 12-subsystem divergence audit run as a Workflow (30 agents), each finding adversarially verified against `upstream/main` (v6.1.0 @ `4c33a60`; rewrite landed in `f0b644d`), plus a content-post sync analysis and a completeness critic. Load-bearing facts (URL parity, config shape, layout head plumbing, OG wiring, fonts, directory-move safety, rename-sweep counts) were independently re-verified by hand.

## Execution outcome & deviations

**P0–P7 complete, committed, and pushed to `origin/jm-astropaper-v6`** (8 commits off `8f7f7ba`). Every phase ended on a green `pnpm build`, and the **built route set stayed byte-identical to the GATE-0 production baseline through all seven phases** — URL parity held across the config rewrite, i18n, the `src/data/blog`→`src/content/posts` move + `blog`→`posts` rename, the token split, the layout/PostLayout split, the component colocation, and the build-tooling. Effort came in well under the 7–11 day estimate because the work was overwhelmingly mechanical (schema and URL logic already matched v6).

**Where execution deviated from the plan below (and why):**

| Plan said | What shipped | Why / backlog |
|---|---|---|
| Move content to `src/content/posts` (Decision 9) | ✅ Done | — |
| Split `getPath` → `getPostSlug`/`getPostUrl` (P3/P6) | **Kept `getPath`** | Not needed for URL parity (identical `/posts/<slug>`); the split only buys locale-aware URLs (we're single-locale). → backlog #4 |
| `SeoJsonLd.astro` via head slot (P5) | **Kept WebSite/WebPage JSON-LD inside `Layout`** (gated to non-articles) | Same output, zero per-page churn, richer than v6 (no hub-page JSON-LD upstream). → backlog #7 |
| Adopt v6 `theme.ts` + `.dark` (P4/P6) | **Kept our `theme.ts`** | Our Header has dual desktop+mobile theme buttons; v6's single-button script wouldn't wire the mobile one. Our `[data-theme=dark]` variant already matches v6. → backlog #5 |
| Conform shared components to v6 (P6) | **Kept custom** Header/Footer/Breadcrumb/Tag/LinkButton | Heavily diverged (SIG nav/footer); v6 verbatim would erase customizations. Did adopt Datetime (muted dates), glob Socials, ResponsiveTable, and the colocated post `_components`. → backlog #6 |
| OG generator resvg→sharp + self-hosted fonts (P5/P7, Decision 3a) | **Left dormant resvg generator** | `dynamicOgImage:false` → it never runs; zero impact. → backlog #2 |
| Adopt `resolveDefaultOgImagePath` (P5) | **Kept inline OG default** | Avoids pulling in the deferred `withBase`. |
| Image lightbox (P6) | **Deferred** | Non-essential. → backlog #3 |
| Pull-update 10 examples + pull-new `astro-paper-6` (P7) | **Pulled `astro-paper-6` only** | The 10 examples need 13 v6 image assets across 4 path conventions + per-post review — a content task. → backlog #1 |
| Adopt v6 CI as a PR gate (P7) | **Added `ci.yml` as `workflow_dispatch` (manual-only)** | Maintainer's call: Vercel already builds deploys; avoid a redundant auto-gate. |
| Migrate `pnpm-workspace` → `allowBuilds` (P7) | **Kept `onlyBuiltDependencies`** | `allowBuilds` is pnpm-11 syntax; we're on pnpm 10. |

Everything deferred lives in **[2026-06-28-astropaper-v6-backlog.md](./2026-06-28-astropaper-v6-backlog.md)**; none of it blocks the merge to `draft`. **P8 (preview cutover)** — the Sveltia `/admin` round-trip at the new paths + Vercel env scope — is deploy-gated and validated by opening a PR into `draft`.

---

## Context — why do this now

We are **already on Astro 6** (framework migration complete). What is behind is the **AstroPaper _theme_**: our tree is still structured like **v5.5.1** (flat `SITE` const, `src/constants.ts` arrays, `getPath`, collection key `blog`, content under `src/data/blog`, no `src/i18n/`, single `global.css`/5 tokens, dormant resvg OG), while upstream is the **v6 ground-up rewrite**. We just finished deliberate prep — theme conformance (`5b470b0`), per-page meta descriptions (`ce9b1f3`), events cleanup (`ed80d99`) — to be ready for this.

**Goal (maintainer's intent):** move *fully* to v6 parity, keeping our customizations updated to sit cleanly on the v6 skeleton, so future `git merge upstream/main` stays cheap. The audit confirms this is overwhelmingly **mechanical re-grafting**, not redesign, because our schema and behavior already match v6's intent.

## Strategy — conform the skeleton, keep the muscle

**Full-parity-keeping-customizations** (not a selective port). The only thing between us and cheap merges is **structural shape** (config three-file layout, i18n scaffold, collection key, content directory, `theme.css` split, OG pipeline, component colocation) — all high-merge-traffic areas. Adoption is mostly mechanical: schema already equals v6's `posts` schema; we already use pagefind; `transformerFileName` is byte-identical; `sharp`/`satori` already at v6 versions; `typography.css` near-identical.

**KEEP exceptions** (deliberate divergences — kept because v6 has no analog or it's our config choice, and each is grafted to sit cleanly on v6):
- `/jams→/events` redirect + `GOOGLE_CALENDAR_API_KEY` secret env — stay in **our** `astro.config.ts` (site-specific, absent upstream).
- **jobs board, events/Calendar, GameEmbed, JobCard** — custom features v6 lacks; keep, re-seat on v6 host primitives.
- **Vercel `@vercel/analytics` + `SpeedInsights`** — re-attach in the v6 `<body>` (upstream isn't on Vercel).
- **Custom Header** (two-row, 6-item, mobile theme-sync) — *re-skin* onto v6 primitives, don't replace.
- **Richer `WebSite`/`WebPage` JSON-LD for non-post pages** — carry through v6's `<slot name="head">` (v6 ships only `BlogPosting`); this is the `ce9b1f3` work — **do not undo**.
- **UI typeface = system `font-mono`** (our current look) instead of v6's self-hosted Google Sans Code — design choice (Decision 2).
- **Static OG behavior** — `dynamicOgImage:false`, per-post `ogImage` + static site-logo fallback (Decision 3).
- **`features.editPost:{enabled:false}`** — our config choice (not structural).

## Already done — do NOT redo

- Astro 6 framework + Content Layer; **content schema is byte-identical to v6's `posts` schema**.
- **URL parity is free**: `/posts/<slug>` derives from frontmatter `slug:` via the glob loader (verified: 32 published posts carry `slug:`, none slugless). Renaming `blog`→`posts` **and moving `src/data/blog`→`src/content/posts`** preserves **every** URL — the collection key and base path never enter a URL.
- Theme conformance / token work (`5b470b0`); per-page meta descriptions (`ce9b1f3`); events markup (`ed80d99`); pagefind search.

## Per-subsystem decisions (final)

| Subsystem | Decision | Effort / Risk |
|---|---|---|
| **config** (`SITE`/`SOCIALS`/`SHARE_LINKS`/`astro.config`) | **Conform** to v6 three-file config (`astro-paper.config.ts` + `src/types/config.ts` + resolved `src/config.ts`); re-express values; **glob-by-name socials** (move/rename SVGs into `src/assets/icons/socials/`, add `discord`/`bluesky`/`rss`); sweep 26 consumers `SITE.*`→`config.*`. Keep `/jams` + `GOOGLE_CALENDAR_API_KEY` in our `astro.config.ts`; `features.search:'pagefind'`; `editPost:{enabled:false}`; `dynamicOgImage:false`. | M / M |
| **styling + tokens** | **Full conform** to v6's 7-token design **including `--muted-foreground`** (Decision 1). Adopt `theme.css`/`global.css` split; keep our custom hex (define `--accent-foreground`/`--muted-foreground` contrast-checked to our bg, adjustable); update `docs/theme-conformance.md` to record the reversal. | M / M |
| **content-urls** (collections + dir move) | **Move** `src/data/blog`→`src/content/posts` (Decision 9); rename key `blog`→`posts`; split `getPath`→`getPostSlug`/`getPostUrl`; update CMS `config.yml` (3 `folder:` lines) + `.pages.yml` + docs; migrate `rss.xml.ts` in lockstep; preserve `!data.draft` route filter. | M-L / M |
| **i18n** | **Adopt** EN-only string scaffold (`src/i18n/*`); **defer** the URL-helper half (`withBase`/locale-aware paths/RSS) — no-ops at domain root + single locale. | M / L |
| **jobs** (custom) | **Keep**, re-seat on v6 `Main` component + `Breadcrumb`. Styling already conformed (`5b470b0`), so **zero style work**. | S / L |
| **events** (custom) | **Keep**; re-mount on v6 `Main`/`Breadcrumb`; googleapis fetch + no-key fallback untouched. | S / L |
| **OG images** | **Keep static OG** (`dynamicOgImage:false`, per-post `ogImage` + static logo fallback). Adopt v6's `resolveDefaultOgImagePath`. The dynamic generator is dormant today; **keep v6's modern sharp generator in place but disabled** (Decision 3a) so the capability is current + has no build-time font fetch. | S-M / L |
| **cms** (Sveltia) | **No structural change** beyond the 3 `folder:` path updates for the dir move. **Merge-time action:** re-apply `<Content components={{ GameEmbed }} />` in the relocated `src/pages/posts/[...slug]/index.astro` or arcweave embeds silently break. Preview-gated revalidation. | S / M |
| **seo-meta** (head/JSON-LD/desc) | **Re-port** (the `ce9b1f3` work): start from v6 `Layout` (gain `og:type`/`og:site_name`), add `description` to hubs, carry `WebSite`/`WebPage` JSON-LD via a small `SeoJsonLd.astro` through the head slot. | S / L |
| **components** | **Adopt v6 colocation** (Decision 4): post-only components → `src/pages/posts/[...slug]/_components/`; shared stay in `src/components/`; **keep all custom** (Header re-skin, JobCard, GameEmbed). Adopt wins: glob `Socials`/`ShareLinks`, `ResponsiveTable`, image lightbox. | L / M |
| **build-tooling** | **Hybrid**: adopt pure-adds (`experimental.svgOptimizer`, `rehype-callouts`); **keep UI typeface = system `font-mono`** (Decision 2, no Google Sans Code); re-attach our integrations; adopt v6 `ci.yml` PR gate **and** keep `scheduled-build.yml`; **keep `cpx2`** for pagefind copy (v6's `cp -r` is Unix-only, breaks Windows). | M / M |

## Resolved decisions (2026-06-28)

1. **Tokens — FULL CONFORM to v6's 7-token design, incl. `--muted-foreground`.** Commit to v6's improved design; keep our custom base hex but adopt the token *structure* (define `--accent-foreground` + `--muted-foreground`, contrast-checked against our bg `#f2f5ec`/`#21233d`, adjustable later). **This reverses the opacity-only policy from `5b470b0`** — update `docs/theme-conformance.md` to record the decision and *what to revisit if secondary text looks wrong* (try adjusting the `--muted-foreground` hex first).
2. **Fonts — keep our actual fonts; don't quibble on v6's font architecture.** UI typeface stays system `font-mono` (verified current in `global.css:43`), **not** v6's Google Sans Code — so the site looks unchanged. Adopt v6's font handling only where it doesn't change the typeface. Document the decision; *if text rendering differs from intent, revisit the font-family wiring in the v6 Layout.*
3. **OG — keep static, modernize the capability.** `dynamicOgImage:false` stays; per-post `ogImage` + static site-logo fallback (the intended behavior). Adopt v6's `resolveDefaultOgImagePath`. **Sub-choice (a, chosen):** keep v6's modern sharp generator present-but-disabled (no build-time Google Fonts fetch). Alt (b): strip the dormant generator entirely — flag if preferred.
4. **Component colocation — ADOPT v6's layout.** Post-only components → `src/pages/posts/[...slug]/_components/`; shared stay in `src/components/`; all custom components kept.
5. **Socials icons — ADOPT v6 glob-by-name.** Move/rename social SVGs into `src/assets/icons/socials/`, keep the discord/bluesky/rss we added. Watch-items (caught at GATE-1): name↔filename must match exactly (else silent no-icon); repoint `index.astro`'s direct `IconRss` import; `href`→`url` rename.
6. **editPost — keep `{enabled:false}` (config only, not a fork).**
7. **`/jams` — keep exactly as-is.** Bare `/jams`→`/events` redirect on purpose; `/jams/2025-arcjam` stays a live page; no wildcard. (Future jams hub possible.)
8. **LaTeX/Giscus demo posts — ignore** (we deleted them at `1ce4be1`; don't re-pull).
9. **Content directory — MOVE `src/data/blog`→`src/content/posts`.** Verified safe: URLs are slug-derived (no change); the move is depth-preserving so relative image paths (`../../assets/...`) and `@/assets/...` aliases resolve unchanged. Cost = `git mv` 35 files + 3 CMS `folder:` lines (`config.yml:61/138/153`) + `.pages.yml:8` + ~15 doc references + a CMS preview re-test (already in P8). Bonus: the example/release reference posts then sit at upstream's exact paths, making content-doc syncs trivial.

## Content sync (examples + releases)

After the dir move these land under `src/content/posts/`; all stay `draft:true`, excluded from build/sitemap → **zero URL/production impact**.

- **Pull-update — 10 example posts** → `src/content/posts/examples/` (+ `_color-schemes/` for `predefined-color-schemes`): refresh body content from upstream, keep `draft:true`. ⚠️ **Review per-post**: several document v6's stock 7-token system — keep as "how the stock theme works" reference; trim parts that contradict our customized palette/config.
- **Pull-new — 1**: `_releases/astro-paper-6.md` (v6 release announcement) as `draft:true` reference.
- **Ignore — 3**: `example-draft-post`, `how-to-add-latex-equations-in-blog-posts`, `how-to-integrate-giscus-comments` (deleted by us at `1ce4be1`; Decision 8).
- **Leave untouched — 4 releases** (`astro-paper-2..5`): we already have these; upstream's only diffs are metadata flips we intentionally override. Don't pull.

## Phased roadmap (P0→P8, each ends GREEN at a named gate)

Front-loaded: **config (P1) and i18n (P2) unblock almost everything**; critical path is **P1→P3→P5/P6**. P4 and P7 can partly parallelize with a second engineer.

- **P0 — Baseline gate** (~0.25d): capture built route list + production sitemap (21 `/posts` URLs) as the regression artifact; confirm `pnpm build` green on the untouched tree. *GATE-0: baseline captured, build green.*
- **P1 — Config resolver** (~1.5d): add `astro-paper.config.ts` + `src/types/config.ts` + resolved `src/config.ts`; re-express `SITE`/socials/shareLinks; glob-by-name `Socials`/`ShareLinks` + move/rename social SVGs (add `discord`/`bluesky`/`rss`, repoint `index.astro`'s direct `IconRss`); sweep 26 `SITE.*`→`config.*`; keep `/jams` + `GOOGLE_CALENDAR_API_KEY`; `features.search:'pagefind'`, `editPost:{enabled:false}`, `dynamicOgImage:false`. *GATE-1: build green; every social/share/RSS icon renders; no `SITE.*` left.*
- **P2 — i18n string scaffold** (~1d): copy `src/i18n/{index,types,format}.ts` + `lang/en.ts`; add `astro.config` i18n block (`locales:['en']`, `prefixDefaultLocale:false`); retranslate `en.ts`; extend nav keys (`events`/`constitution`/`jobs`). Defer URL-helper layer. *GATE-2: build green; zero `/en/` prefixes; URLs == GATE-0.*
- **P3 — Content move + collection rename + RSS lockstep** (~1.5–2d): `git mv src/data/blog → src/content/posts`; set `BLOG_PATH="src/content/posts"`; update CMS `config.yml` 3 `folder:` lines + `.pages.yml` + doc references (CLAUDE.md/README/`docs/`); rename key `blog`→`posts`; split `getPath`→`getPostSlug`/`getPostUrl` (adapted to `config.site.lang`); sweep ~6 `getCollection` + 18 `CollectionEntry` refs + `getSortedPosts` default→named; migrate `rss.xml.ts` together; preserve `!data.draft` filter; re-confirm `/jams`. *GATE-3 (highest-value): build green; built route set diffed 1:1 vs GATE-0 (21 `/posts` URLs identical); images resolve; RSS items resolve; sitemap unchanged.*
- **P4 — Theme split + 7-token conform** (~1d): split tokens into `theme.css` (custom hex unchanged); define all 7 tokens incl. `--accent-foreground` + `--muted-foreground` (contrast-checked to our bg); adopt additive `.dark` class toggle in theme script + Layout body (our `@custom-variant dark` on `[data-theme=dark]` stays; `.dark` is additive); update `docs/theme-conformance.md` (Decision 1). *GATE-4: build green; light+dark visual diff on home/post/jobs/events shows no unintended shift; secondary text legible; toggle + FOUC work; doc updated.*
- **P5 — Layout + SEO-meta + OG** (~1.5–2d): move to v6 `Layout`/`PostLayout` split; gain `og:type`/`og:site_name` + `resolveDefaultOgImagePath`; **keep UI `font-mono`** (no Google Sans Code); **preserve Vercel `SpeedInsights`/`analytics`**; `SeoJsonLd.astro` via head slot for `WebSite`/`WebPage`; `description` on hub layouts; keep `DefaultLayout` `.mdx` shim + our fuller favicon/PWA set; OG: keep `dynamicOgImage:false` + `public/game-writing-og.jpg`, adopt v6's sharp generator present-but-disabled (self-hosted font, no build fetch), remove dead `/og.png` fallback. *GATE-5: build green; per-page `<head>` description + canonical correct; JSON-LD validates (BlogPosting/WebSite/WebPage); OG meta points at per-post/static image; Vercel scripts present; UI font unchanged.*
- **P6 — Components + custom-feature re-seat** (~1.5–2d): adopt v6 colocation (post-only → `_components/`); port shared/post components to v6; adopt glob `Socials`/`ShareLinks`, `ResponsiveTable`, image lightbox; **re-skin custom Header**; re-seat **jobs** (board-as-sibling-of-`Main` keeps `Main` byte-identical = cheapest merges) + **events** on v6 `Main`/`Breadcrumb`; **re-apply `<Content components={{ GameEmbed }} />`** in relocated `posts/[...slug]/index.astro`; keep `BackToTopButton` shared; reconcile `search.astro` with v6 i18n/feature-gate. *GATE-6: build green; Header nav (6 items, mobile theme-sync), jobs filters, events table, GameEmbed, lightbox, copy-code, progress bar all work; `/jams` + `/jams/2025-arcjam` resolve.*
- **P7 — Build-tooling + CI + content sync** (~1d): add `experimental.svgOptimizer` + `rehype-callouts` (+ deps), drop unused; migrate `pnpm-workspace` `onlyBuiltDependencies`→`allowBuilds`; keep `cpx2` pagefind copy; adopt v6 `ci.yml` (lint/format/build PR gate) + keep `scheduled-build.yml`; apply content sync (pull-update 10 examples → `src/content/posts/examples`, pull-new `astro-paper-6`, ignore 3, leave 4 releases). *GATE-7: `ci.yml` green on PR; pagefind index builds; scheduled hook intact; synced posts `draft:true` and absent from sitemap.*
- **P8 — Preview cutover gate** (~0.5–1d): deploy worktree to preview; verify `/admin` (3 Sveltia collections round-trip to GitHub at the **new `src/content/posts` paths**, asset picker, `public_folder '@/assets/'` alias-write, GameEmbed render); confirm Vercel env (`PUBLIC_GOOGLE_SITE_VERIFICATION`, `GOOGLE_CALENDAR_API_KEY`, deploy hook); diff preview routes vs GATE-0; reconcile `backend.branch`. *GATE-8: preview green; CMS round-trips at new paths; calendar renders with key + degrades without; route set == baseline → ready to PR into `draft`.*

## Critical files

- **New (from v6):** `astro-paper.config.ts`, `src/types/config.ts`, `src/i18n/{index,types,format}.ts` + `lang/en.ts`, `src/styles/theme.css`, `src/utils/getPostPaths.ts`, `src/utils/getFontPathByWeight.ts`, `src/utils/resolveDefaultOgImagePath.ts`, `src/layouts/PostLayout.astro`, `SeoJsonLd.astro`, `.github/workflows/ci.yml`.
- **Rewritten/conformed:** `src/config.ts` (resolved), `src/content.config.ts` (key `posts`, `BLOG_PATH="src/content/posts"`), `src/layouts/Layout.astro` (head slot + Vercel + verification + `font-mono`), `src/components/{Socials,ShareLinks,Header,Main}.astro`, `src/pages/posts/[...slug]/index.astro` (+ re-apply GameEmbed), `src/pages/{index,search}.astro`, `src/pages/rss.xml.ts`, `src/pages/posts/[...slug]/index.png.ts`, `astro.config.ts`, `package.json`, `pnpm-workspace.yaml`, `public/admin/config.yml` (3 `folder:` lines), `.pages.yml`, `docs/theme-conformance.md`.
- **Moved:** `src/data/blog/**` → `src/content/posts/**` (`git mv`).
- **Keep, re-seat:** `src/pages/jobs.astro` + `src/lib/jobs.ts` + `JobCard.astro`, `src/pages/events.astro`, `GameEmbed`.

## Verification

- **Per gate:** `pnpm build` green (type-check + build + pagefind).
- **GATE-3 (the blocker):** diff built route list vs GATE-0 — any `/posts/<slug>` delta is stop-the-line; images + RSS + sitemap unchanged.
- **GATE-5:** JSON-LD validates per page type; per-page description + canonical correct; OG resolves; Vercel beacons present; UI font visually unchanged.
- **GATE-8 (preview-only):** Sveltia `/admin` round-trips a real edit to GitHub at the new `src/content/posts` paths; asset picker + `@/assets` alias-write; GameEmbed renders; `/events` renders with the key and degrades without it.
- Throughout: never merge a half-migrated tree to a deployable branch; work stays in `.worktrees/jm-astropaper-v6` → PR into `draft` (preview) → `draft`→`main` to ship.

## Effort

**~7–11 focused days (~1.5–2 calendar weeks, solo)**, sequenced P0→P8 with a green gate each. Heaviest: P1 config sweep, P3 move+rename, P6 components + re-seat. Add ~1–2 days contingency for the token/font visual sign-offs and the preview-only CMS alias-write verification. With a second engineer, P4/P7 parallelize to ~1 week.

## Open gaps / provenance notes

- The **layouts** audit agent failed (structured-output retry cap); covered here by P5 + direct reading of v6 `Layout.astro`/`PostLayout.astro` and ours.
- Critic-flagged items folded into phases: OG build-time font-fetch fragility (removed via self-hosted OG font / dormant generator, P5), v6 PR `ci.yml` (P7), theme-script `.dark`-class vs `data-theme` (P4), Vercel preservation (P5), RSS lockstep (P3), `search.astro` reconciliation (P6), `/jams/*` coverage (Decision 7).
- Optional cheap risk-control (out of parity scope): retire legacy `.pages.yml` if confirmed dead; pin the Sveltia CDN for the upgrade window.
