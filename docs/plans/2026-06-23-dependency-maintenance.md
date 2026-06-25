# Dependency Maintenance — June 2026

**Date:** 2026-06-23
**Branch:** `draft` (preview deploy; not yet merged to `main`)
**Author:** Jon (with Claude)

## Summary

Migrated to **Astro 6** (the headline change), took the coupled and low-risk major bumps that come with it, and applied the routine minor/patch bumps. Then, in a **second wave the same day**, cleared three more held majors after per-package validation: **ESLint 10**, **TypeScript 6**, and **`googleapis` 173**. Now holding only **Astro 7** (too fresh) and **`sharp` 0.35** (native dep) for separate, dedicated passes.

This is the green-light follow-through on the April plan's #1 watch trigger: the upstream AstroPaper theme shipped its Astro 6 release (`feat!: AstroPaper v6`, upstream `f0b644d`, now tagged at theme v6.1.0 on `astro@^6.4.x`).

## What changed

### Astro 6 migration (the headline)

| Package | From | To | Note |
|---|---|---|---|
| `astro` | 5.16.6 | **6.4.8** | Major. Node 22.12+, Vite 7, Shiki 4, Zod 4 |
| `@astrojs/mdx` | 4.3.13 | **6.0.3** | Coupled to Astro 6 (mdx 7 is for Astro 7) |
| `@shikijs/transformers` | 3.20.0 | **4.2.0** | Astro 6 bundles Shiki 4; transformer API unchanged |
| `@astrojs/markdown-remark` | — | **7.2.0** (new) | Required to keep remark plugins working under Astro 6's mdx |

**Config changes ([astro.config.ts](../../astro.config.ts)):**

1. **Markdown processor.** Astro 6 deprecates `markdown.remarkPlugins` / `rehypePlugins`. Migrated to the new canonical pattern (mirrors upstream v6): import `unified` from `@astrojs/markdown-remark` and pass `markdown.processor: unified({ remarkPlugins: [...] })`. Our plugins (`remark-toc`, `remark-collapse`) are unchanged.
2. **Dropped `experimental.preserveScriptOrder`.** It graduated to default behavior in Astro 6; leaving it under `experimental` is now a hard config error ("Invalid or outdated experimental feature"). Script order is preserved by default, so behavior is retained.
3. **Removed the Vite 7 `@ts-ignore` workaround** on the `tailwindcss()` Vite plugin — the type issue it guarded ([astro#14030](https://github.com/withastro/astro/issues/14030)) is resolved in Astro 6.
4. **`z` now imported from `astro/zod`** in [content.config.ts](../../src/content.config.ts). Astro 6 deprecates the `z` re-export from `astro:content` (`ts(6385)`); the Zod-4-aligned export lives at `astro/zod`. `import { defineCollection } from "astro:content"` + `import { z } from "astro/zod"` (mirrors upstream v6). `astro check` is clean afterward (0 errors / 0 warnings / 0 hints across 52 files).

**Why the migration was low-friction for us (de-risked):**

- ✅ Already on the **glob loader** in [content.config.ts](../../src/content.config.ts), so Astro 6's mandatory Content Layer migration was already satisfied. No `Astro.glob()` anywhere.
- ✅ Local Node is v24 (clears the new 22.12+ floor). Added `engines.node: ">=22.12.0"` to [package.json](../../package.json) to document it. **Verify Vercel's Node version is 22+ before merging to main.**
- ✅ Our Zod schema is Zod-4-clean (no `.email()`, no `{ message }` error customization, defaults already match output types).
- ✅ The config already carried a `// fixed in Astro 6` TODO for the Vite plugin.

### Low-risk majors (taken alongside Astro 6)

| Package | From | To | Rationale |
|---|---|---|---|
| `cpx2` | 8.0.0 (exact pin) | **^9.0.0** | 9.0.0 is "migrate to ESM" — this *is* the fix for the `ERR_REQUIRE_ESM` we pinned around. Unpinned. CLI-only usage; verified copy exits 0. |
| `satori` | 0.18.3 | **0.26.0** | OG image generation. Purely additive (CSS vars, JSX runtime); no `satori()`/font API changes. `dist/og.png` regenerates fine. |
| `@vercel/analytics` | 1.6.1 | **2.0.1** | v2 = "resilient intake"; *no config change required, existing implementations keep working*. Our usage is stock `inject()` in Layout.astro. |
| `@vercel/speed-insights` | 1.3.1 | **2.0.0** | Same as above; stock `<SpeedInsights />`. **Confirm analytics/speed data still reports on preview.** |

### Routine minor/patch bumps

| Package | From | To |
|---|---|---|
| `@astrojs/sitemap` | 3.7.2 | 3.7.3 |
| `dayjs` | 1.11.20 | 1.11.21 |
| `tailwindcss` + `@tailwindcss/vite` | 4.2.4 | 4.3.1 |
| `@tailwindcss/typography` | 0.5.19 | 0.5.20 |
| `@astrojs/check` (dev) | 0.9.8 | 0.9.9 |
| `@typescript-eslint/parser` + `typescript-eslint` (dev) | 8.59.0 | 8.62.0 |
| `globals` (dev) | 17.5.0 | 17.7.0 |
| `prettier` (dev) | 3.8.3 | 3.8.4 |
| `prettier-plugin-tailwindcss` (dev) | 0.7.3 | 0.8.0 |

## Verification (local)

- ✅ `pnpm build` — exit 0. `astro check` clean; 43 pages built; images optimized; **satori `og.png` generated** (generated, not static — proves satori 0.26 + resvg work); Pagefind indexed 19 pages; `cpx2 9` copied pagefind output (exit 0).
- ✅ `pnpm dev` — **`astro v6.4.8 ready in 3.1s`** on the Vite 7 dev environment. All core routes 200: `/`, `/posts/`, `/events/`, `/search/`, `/tags/`, `/archives/`, `/about/`. Live events calendar returned 3 events (googleapis 170 still works). MDX post page renders.
- ⚠️ `pnpm lint` — 3 **pre-existing** `no-console` errors in [src/pages/events.astro](../../src/pages/events.astro) (lines 48–49 are leftover debug `console.log`s; line 51 is a legit `console.error`). **Not introduced by this round** (file untouched; the same 3 errors persist identically under both ESLint 9 and the ESLint 10 bump below). Clean up separately.
- Known benign warning: Pagefind reports `/jams/` has no `<html>` element — expected, it's our `/jams` → `/events` redirect.

## Decisions and rationale

### Chose Astro 6, NOT Astro 7

Astro 7.0 shipped ~2026-06-22 (one day before this work). It makes the new **Rust compiler** the only compiler (stricter HTML parsing) and changes the default Markdown processor to "Satteri", requiring `@astrojs/markdown-remark` for remark/rehype users. Far too fresh for a content site, and upstream AstroPaper has not followed to 7 either (still on `astro@^6.4.x`). Astro 6 is the mature, upstream-tested target.

### Second wave — low-risk majors validated on `draft` (same day)

After the Astro 6 round landed, took the three lowest-risk held majors and verified each independently. All green; **no code changes required**.

| Package | From | To | Validation |
|---|---|---|---|
| `googleapis` | 170.0.0 | **173.0.0** | `/events` → 200 with **3 live calendar events** (Calendar v3 fetch works exactly as on 170). |
| `eslint` | 9.39.2 | **10.5.0** | `pnpm lint` parses every file; only the 3 pre-existing `no-console` errors remain (no new errors / parse failures). Kept `eslint-plugin-astro@1.7.0` — its peer is `eslint: >=8.57.0`, so the 2.0 major isn't needed (mirrors upstream). |
| `typescript` | 5.9.3 | **6.0.3** | `astro check` → **0 errors / 0 warnings / 0 hints** (52 files). Our tsconfig extends `astro/tsconfigs/strict`, absorbing TS 6's 9 default flips; we use none of the removed options. `@typescript-eslint/parser@8.62` already peers `typescript <6.1.0` + `eslint ^10`, so no toolchain bump needed. |

Full `pnpm build` after all three: **exit 0**.

### Still held (revisit triggers below)

| Package | From | To (avail.) | Why held |
|---|---|---|---|
| `astro` / `@astrojs/mdx` | 6.4.8 / 6.0.3 | 7.0.2 / 7.0.0 | Astro 7 is days old; **Rust compiler** (stricter HTML — could trip our MDX + `GameEmbed`) + markdown-engine swap to Satteri. Wait for upstream to adopt 7 and a few patch releases. **Highest risk.** |
| `sharp` | 0.34.5 | 0.35.2 | Native dep (libvips 8.18.3, AVIF retune, install-script removed). We don't import sharp directly — it's only Astro's image backend — so the risk is Astro 6 image-pipeline compatibility. Upstream still holds 0.34.5. Validate on the **Vercel Linux build**, not just local Windows. |
| `eslint-plugin-astro` | 1.7.0 | 2.0.0 | **Not needed** — 1.7.0 already accepts ESLint 10. Only revisit if a future rule/plugin requires it. |

### Upstream cherry-picking is now effectively over

Everything after `f0b644d` (`feat!: AstroPaper v6`) lives on a **ground-up rewrite** — new i18n system, `BaseLayout`/`PostLayout` replacing `Layout.astro`, design-token overhaul, `astro-paper.config.ts`. Nothing post-v6 applies cleanly to our diverged tree, and a `git pull upstream main` would be destructive. Future borrowing means **porting ideas by hand**, not `git cherry-pick`/merge. Upstream remains useful as a *reference* for "how to configure X on Astro 6" (that's exactly how the `unified()` markdown pattern here was sourced).

## Pre-merge-to-main checklist

Smoke-test on `preview.game-writing.com` before promoting `draft` → `main`:

- [ ] **Vercel build is on Node 22+** (Astro 6 hard requirement) — check project settings / build logs
- [ ] Vercel build logs clean — no deprecation warnings
- [ ] Home, posts, post detail, `/tags`, `/archives`, `/about` all render
- [ ] **Code blocks** render with correct light/dark Shiki themes + diff/highlight transformers (Shiki 3 → 4)
- [ ] Theme toggle (light ↔ dark) + no FOUC
- [ ] Search bar autofocus + result titles (Pagefind)
- [ ] **OG images**: share a post *without* a custom `ogImage` and verify the satori card (satori 0.18 → 0.26)
- [ ] Events calendar loads on `/events` (googleapis 173 — validated locally, re-check on preview)
- [ ] **Vercel Analytics + Speed Insights still reporting** (both bumped to v2)
- [ ] `pnpm lint` / CI lint runs under ESLint 10 (only the 3 pre-existing `no-console` errors expected)
- [ ] Vercel build type-checks clean under TypeScript 6
- [ ] In-page TOC anchor links still work (Astro 6 changed heading-ID generation — trailing hyphens no longer stripped; low risk for our content)

## Forward-looking maintenance plan

### Watch for (revisit triggers)

1. **Astro 7 adoption** — when upstream AstroPaper moves to `astro@^7` AND a few `astro@7.x` patch releases have shipped, plan the 6 → 7 jump (Rust compiler, markdown-engine). Check the [Astro v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/).
2. **`sharp` 0.35** — only remaining non-Astro held major. Bump + full build + verify optimized images on the **Vercel Linux build** (native binary differs from local). Upstream adopting 0.35 is a good green-light signal.
3. **Satori 1.0** — still 0.x; do an OG visual regression when it hits 1.0.
4. **TypeScript 7** — the Go-native rewrite is coming after TS 6 (the last JS-based release); TS 6's `ignoreDeprecations` escape hatch is removed in 7, so clear any deprecation warnings before then.

*(Done this round: ESLint 10, TypeScript 6, googleapis 173 — see "Second wave" above.)*

### Suggested cadence (unchanged)

- **Monthly:** `pnpm outdated`, take patch+minor, build, smoke-test preview.
- **Quarterly:** review upstream with `git log <ref>..upstream/main --oneline` for *ideas to port by hand* (no more merges/cherry-picks — see above).
- **On any major:** land on `draft`, deploy to preview, smoke-test, then merge.

### Things to avoid

- Don't `pnpm update --latest` without listing packages (pulls Astro 7, etc.).
- Don't `git pull upstream main` / merge upstream — the v6 rewrite makes it destructive. Port ideas by hand.
- Don't bump `googleapis` without testing `/events`.
- Don't re-pin `cpx2` — 9.0.0 (ESM) resolved the `ERR_REQUIRE_ESM` regression.
