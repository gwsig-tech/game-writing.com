# AstroPaper v6 — post-migration backlog (2026-07-03)

**Context:** the v6 parity migration (P0–P7) **shipped** — merged to `draft` via PR #16, then propagated to `main`/production via PR #17 — see [2026-06-28-astropaper-v6-parity-migration.md](./2026-06-28-astropaper-v6-parity-migration.md) for the as-built record. A first follow-up polish round (getPath split, v6 `theme.ts`, image lightbox, OG generator modernization) shipped 2026-07-03 — see that doc's *Execution outcome & deviations* section for what changed. This doc renames and replaces `2026-06-28-astropaper-v6-backlog.md` (completed items cut, not carried forward — see git history for the prior version) and contains **only what's still open**. None of it is production-blocking. Pick any item up independently in the `jm-astropaper-v6` worktree (still present, currently at the same commit as `draft`) or a fresh one off `draft`.

---

## 1. Example / reference post refresh (content task)

- **What:** our `src/content/posts/examples/` posts are still the v5.5.1-era versions. v6 rewrote them (MD→MDX, `<ResponsiveTable>`, callouts, new-config docs). The v6 **release post `_releases/astro-paper-6.md` was pulled**; the 10 examples were **not**.
- **Why deferred:** each upstream example references v6 demo images — ~13 assets across **4 path conventions** (`@/assets`, `../../assets`, `assets/`, `/assets`) — and needs per-post review (several document stock v6's 7-token palette, which differs from ours). It's a content task, not a mechanical pull, and a sloppy pull breaks the build (missing-image schema errors, even for drafts).
- **How:** pull each example from `upstream/main` (paths listed in the migration doc's *Content sync* section), pull its referenced images to the matching relative locations, set `draft: true`, then `pnpm build` + confirm routes unchanged. `ResponsiveTable` is already registered in the post `<Content components>`; `rehype-callouts` is already wired — so the pulled MDX will render correctly.
- **Effort:** ~0.5–1d (content).

## 2. Component alignment — Header / Footer / Breadcrumb / Tag / LinkButton

- **What / why kept:** these stayed **custom**. They've diverged substantially from v6 (Breadcrumb ~155, Tag ~74, Footer ~62, LinkButton ~42 changed lines) for SIG-specific reasons; adopting v6 verbatim would **erase intentional customizations** (the 6-item nav, SIG footer, etc.). Per the "keep our customizations" principle, we kept them; they conform to AstroPaper's flat/minimal language.
- **How (if desired):** selectively graft v6 structural improvements while preserving our nav/content. Low priority — not merge-blocking, and these files rarely change upstream.

## 3. `SeoJsonLd` extraction (optional structural parity)

- **What / why kept inline:** our richer `WebSite`/`WebPage` JSON-LD lives inside `Layout.astro` (gated to non-article pages so there's no double-emit with `PostLayout`'s `BlogPosting`). v6's pattern would be a separate `SeoJsonLd.astro` injected per hub page via the head slot. We kept it inline: **same output, zero per-page churn, and richer than v6** (v6 ships no hub-page structured data).
- **How (if desired):** extract to `SeoJsonLd.astro`. Low value.

## 4. `withBase` / URL-helper layer

- **What / why deferred:** v6's `withBase`/`getAssetPath` + locale-aware URL helpers are **no-ops** at the domain root with a single locale.
- **How:** adopt only if a non-empty base path or a second locale is ever introduced.

## 5. Operational / config follow-ups

- **CI activation:** [.github/workflows/ci.yml](../../.github/workflows/ci.yml) is `workflow_dispatch` (manual-only) on purpose — Vercel already builds deploys. To make it a PR gate (adds `lint` + `format:check`), add the `pull_request` trigger noted in the file.
- **`pnpm-workspace`:** kept `onlyBuiltDependencies` (pnpm-10 syntax). Migrate to `allowBuilds` only when/if the repo moves to pnpm 11.
- **Vercel env scope:** make sure `GOOGLE_CALENDAR_API_KEY` is set for the **Preview** environment, not just Production — otherwise `/events` shows "not configured" on previews. (For local dev/build in a worktree, copy `.env` in — it's gitignored, so it isn't carried into `.worktrees/`.)
- **Formatting:** `pnpm format:check` reports pre-existing style issues across the repo (predates this migration). Per the "never whole-repo format" convention, left untouched; format deliberately if/when wanted.
- **Decision B (pre-existing):** centralizing the `` | ${config.site.title} `` title suffix into `Layout` is still deferred — see [2026-06-27-page-meta-descriptions.md](./2026-06-27-page-meta-descriptions.md).
