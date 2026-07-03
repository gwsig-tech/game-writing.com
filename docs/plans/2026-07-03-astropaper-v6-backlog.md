# AstroPaper v6 — post-migration backlog (2026-07-03)

This is the active backlog for the AstroPaper v6 work — **only items still to do.** History (what shipped, when, and why things were deferred) lives in [2026-06-28-astropaper-v6-parity-migration.md](./2026-06-28-astropaper-v6-parity-migration.md), not here. This doc renames and replaces `2026-06-28-astropaper-v6-backlog.md`; completed items are cut, not carried forward or marked done — see git history for the prior version if you want that record.

Settled decisions that will **not** be revisited as work items (custom Header/Footer/Breadcrumb/Tag/LinkButton, inline `WebSite`/`WebPage` JSON-LD instead of a `SeoJsonLd.astro`, the deferred `withBase` URL-helper layer) live in the migration doc's *Per-subsystem decisions* table — they're closed calls with documented rationale, not backlog items.

None of what's below is production-blocking. Pick any item up independently in the `jm-astropaper-v6` worktree (still present, currently at the same commit as `draft`) or a fresh one off `draft`.

---

## 1. Example / reference post refresh (content task)

- **What:** our `src/content/posts/examples/` posts are still the v5.5.1-era versions. v6 rewrote them (MD→MDX, `<ResponsiveTable>`, callouts, new-config docs). The v6 **release post `_releases/astro-paper-6.md` was pulled**; the 10 examples were **not**.
- **Why deferred:** each upstream example references v6 demo images — ~13 assets across **4 path conventions** (`@/assets`, `../../assets`, `assets/`, `/assets`) — and needs per-post review (several document stock v6's 7-token palette, which differs from ours). It's a content task, not a mechanical pull, and a sloppy pull breaks the build (missing-image schema errors, even for drafts).
- **How:** pull each example from `upstream/main` (paths listed in the migration doc's *Content sync* section), pull its referenced images to the matching relative locations, set `draft: true`, then `pnpm build` + confirm routes unchanged. `ResponsiveTable` is already registered in the post `<Content components>`; `rehype-callouts` is already wired — so the pulled MDX will render correctly.
- **Effort:** ~0.5–1d (content).

## 2. Operational / config follow-ups

- **CI activation:** [.github/workflows/ci.yml](../../.github/workflows/ci.yml) is `workflow_dispatch` (manual-only) on purpose — Vercel already builds deploys. To make it a PR gate (adds `lint` + `format:check`), add the `pull_request` trigger noted in the file.
- **`pnpm-workspace`:** kept `onlyBuiltDependencies` (pnpm-10 syntax). Migrate to `allowBuilds` only when/if the repo moves to pnpm 11.
- **Vercel env scope:** make sure `GOOGLE_CALENDAR_API_KEY` is set for the **Preview** environment, not just Production — otherwise `/events` shows "not configured" on previews. (For local dev/build in a worktree, copy `.env` in — it's gitignored, so it isn't carried into `.worktrees/`.)
- **Formatting:** `pnpm format:check` reports pre-existing style issues across the repo (predates this migration). Per the "never whole-repo format" convention, left untouched; format deliberately if/when wanted.
- **Decision B (pre-existing):** centralizing the `` | ${config.site.title} `` title suffix into `Layout` is still deferred — see [2026-06-27-page-meta-descriptions.md](./2026-06-27-page-meta-descriptions.md).
