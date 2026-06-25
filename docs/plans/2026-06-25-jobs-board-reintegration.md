# Jobs Board — Re-integrate cleanly onto the Astro 6 upgrade — June 2026

**Date:** 2026-06-25
**Branch:** `narrative-job-board-jm` (= `narrative-job-board` / `origin/narrative-job-board`, HEAD `e6ed38c`)
**Author:** Jon (with Claude)
**Status:** Planned — ready to execute. Fix is in-place on the jobs branch.

## Context

Another developer built a solid **jobs board** feature on `narrative-job-board`.
That branch **already contains** the June Astro 6 upgrade — it merged
`main@2e12a44` in at commit `902a380`. The problem is the very next commit,
**`b8e1aa0` "Fix Astro build config and lockfile," resolved that merge by
DOWNGRADING the framework back to Astro 5** — but only three files:
[astro.config.ts](../../astro.config.ts), [package.json](../../package.json),
`pnpm-lock.yaml`. The result is an **inconsistent tree**: Astro-5 toolchain +
Astro-6 source (e.g. [content.config.ts](../../src/content.config.ts) imports `z`
from `astro/zod`, which doesn't exist in Astro 5), which likely doesn't build cleanly.

**Goal:** on this branch, restore the stable Astro 6 framework (undo the
downgrade), keep the well-built feature, fix two small gaps (SEO description +
View-Transitions script re-bind), verify the whole site builds, then land via the
normal flow. The feature is **not** rebuilt and **not** cherry-picked onto a new
branch — it's already here; we just correct what `b8e1aa0` got wrong.

**Decisions:**
- Mobile nav: **keep main's icon-button Archives link** (the branch also restyled it
  to plain text — unrelated to jobs; revert that part).
- Include the **View-Transitions script fix**.
- **JobPosting structured data** is documented as a separate future feature —
  see [2026-06-25-job-posting-structured-data.md](./2026-06-25-job-posting-structured-data.md).

## Diagnostic workflow — comparing a feature branch against an upgraded trunk

The reusable method (all read-only). **The trap:** `git diff main..<branch>`
conflates the feature's real changes with the *reverse* of everything the branch
is missing/changed in the framework. **Don't diff against the tip — diff against
the merge-base.**

```bash
# 1. Topology — where did the branch fork, and has it already absorbed the trunk?
git merge-base origin/main origin/narrative-job-board                       # -> 2e12a44 (== current main)
git merge-base --is-ancestor origin/main origin/narrative-job-board; echo $?  # 0 = main is an ancestor
git log --oneline --graph origin/narrative-job-board -14                    # see merge 902a380 + downgrade b8e1aa0

# 2. Isolated changeset (clean precisely because merge-base == main)
git diff --stat 2e12a44..origin/narrative-job-board                         # 13 files
git diff --name-status 2e12a44..origin/narrative-job-board

# 3. Confirm framework regression ("did they undo fundamentals?")
git show origin/narrative-job-board:package.json   | grep -E '"astro"|mdx'  # ^5.16.6 vs main ^6.4.8
git show origin/narrative-job-board:astro.config.ts | grep -nE 'unified|remarkPlugins'  # v5 remarkPlugins, no unified()
```

Then **classify** each changed file into feature-additive / framework-regression /
docs, and decide **restore-vs-keep** per file. (Generalizes to any feature branch
vs an upgraded trunk.)

## Findings

### Topology (verified)
`narrative-job-board` = [old jobs work] → `902a380` (merge `main@2e12a44`, Astro 6)
→ `b8e1aa0` (DOWNGRADE config + lockfile to Astro 5; `package.json` reverted in this
stretch too) → `32cf88a`/`034d822`/`3dcf82e`/`e6ed38c` (jobs refinements).

### The 13-file changeset, classified (`git diff 2e12a44..jobs`)
| Disposition | Files |
|---|---|
| **KEEP** (feature, additive, Astro-6-safe) | [src/pages/jobs.astro](../../src/pages/jobs.astro), [src/components/JobCard.astro](../../src/components/JobCard.astro), [src/lib/jobs.ts](../../src/lib/jobs.ts), `src/data/jobs/job_postings.csv`, `src/data/jobs/README.md`, `docs/plans/2026-04-26-jobs-feature-completion.md` |
| **RESTORE** to main's Astro 6 | `astro.config.ts`, `package.json`, `pnpm-lock.yaml` (the `b8e1aa0` downgrade) |
| **RECONCILE** | [src/components/Header.astro](../../src/components/Header.astro) (keep `/jobs` nav add; revert the unrelated mobile-Archives restyle), `CLAUDE.md`, `README.md` (branch dropped June notes → take main's), `.gitignore` (branch adds `.pnpm-store/` + EOF newline — harmless, keep) |

### Feature quality (verified Astro-6-safe — no rewrite needed)
- **`src/lib/jobs.ts`** — pure `node:fs/promises` + `node:path`; reads the committed
  CSV at build time; hand-rolled RFC-4180 parser; **no `astro:content`, no `Astro.glob`,
  no new deps.** Throws on a malformed CSV (build fails loudly — acceptable).
- **`src/pages/jobs.astro`** — uses the shared `Layout` + `Header`/`Footer`; top-level
  `await getActiveJobs()` (build-time SSG); inline bundled `<script>` for filtering.
- **`src/components/JobCard.astro`** — no imports; current `class:list`/`hidden` syntax;
  styling via `color-mix()` on AstroPaper tokens (`--accent`/`--foreground`/`--background`/`--border`)
  → light/dark correct.

### Two gaps to fix on the way in
1. **SEO:** `jobs.astro` passes `title` but not `description` to `Layout` → generic
   `og:description` (falls back to `SITE.desc`).
2. **View Transitions:** the page `<script>` (lines 212–384) binds on hard load but has
   **no `astro:page-load`/`astro:after-swap` handler**, so reaching `/jobs` via an
   in-site nav click (Layout has `<ClientRouter />`) leaves filters & "load more"
   **dead until a hard refresh.**

## Integration plan (in-place on `narrative-job-board-jm`)

**0. Safety + clean baseline**
```bash
git status                                     # confirm clean
git branch backup/jobs-pre-fix-2026-06-25      # cheap rollback point
```

**1. Restore the Astro 6 framework (undo `b8e1aa0` — the "get back to stable" step)**
```bash
git checkout origin/main -- astro.config.ts package.json pnpm-lock.yaml
```
Toolchain returns to Astro 6 (astro `^6.4.8`, mdx `^6.0.3`, `@astrojs/markdown-remark`,
`markdown.processor: unified({...})`, the Astro-6 lockfile). The feature added no deps
and no config, so taking main's is purely correct.

**2. Header — take main's, re-add only the `/jobs` nav (keep main's mobile Archives)**
```bash
git checkout origin/main -- src/components/Header.astro
```
Then hand-insert two whitespace-clean blocks:
- Desktop nav — after the **Tags** `<li>…</li>`, before `</ul>`:
  ```astro
  <li>
    <a
      href="/jobs"
      class:list={["font-medium hover:text-accent", { "active-nav": isActive("/jobs") }]}
    >
      Jobs
    </a>
  </li>
  ```
- Mobile menu — after the `SITE.showArchives && ( … )` block, before the Search `<li>`:
  ```astro
  <li class="col-span-2">
    <a href="/jobs" class:list={{ "active-nav": isActive("/jobs") }}>
      Jobs
    </a>
  </li>
  ```
Do **not** `git checkout` Header from the jobs branch (that drags in the
mobile-Archives icon→text restyle we're rejecting).

**3. Docs — keep main's June docs; fold in a jobs note**
```bash
git checkout origin/main -- CLAUDE.md README.md
```
Optionally note in README/CLAUDE: jobs data lives in `src/data/jobs/job_postings.csv`
(build-time), refreshed by the external `narrative_job_board` service; see
`src/data/jobs/README.md`. Leave `.gitignore` as the branch has it.

**4. SEO fix — `src/pages/jobs.astro` (~line 43)**
```astro
<Layout
  title="Jobs | IGDA Game Writing SIG"
  description="Open narrative and game-writing roles collected from public postings, curated by the IGDA Game Writing SIG."
>
```

**5. View-Transitions fix — `src/pages/jobs.astro` `<script>` (212–384)**
Wrap the body in `setupJobsPage()` and bind on `astro:page-load` (fires on initial
load **and** after every VT swap). **Guard the one document-level listener** (the
dropdown "click outside to close" at ~line 251): attach it ONCE outside `setupJobsPage`
(or via a module flag), since `document` persists across swaps and re-adding it each
navigation stacks duplicates. Element-scoped listeners are safe to re-run (elements are
replaced each swap). Mirror the proven pattern in `src/components/Header.astro`.
```js
<script>
  function setupJobsPage() { /* existing element-scoped wiring */ }
  document.addEventListener("astro:page-load", setupJobsPage);
  // attach the single document-level click-to-close handler once, here
</script>
```

**6. Reinstall + verify** (next section).

**7. Commit**
```
fix(jobs): restore Astro 6 toolchain and integrate the jobs board cleanly

The branch merged main's Astro 6 upgrade, then b8e1aa0 downgraded
astro.config.ts/package.json/pnpm-lock.yaml back to Astro 5. Restore those to
main's Astro 6 versions, keep the jobs feature, re-add only the /jobs nav
(preserving main's mobile Archives), add the Layout description, and re-init the
filter script on astro:page-load for View Transitions.
```
Then land via the normal flow (this branch → preview → main).

## Verification

```bash
pnpm install        # REQUIRED: node_modules is currently Astro 5; resync to the Astro 6 lockfile
pnpm build          # astro check + astro build + pagefind — the real proof the feature is Astro-6-clean
pnpm lint
pnpm format:check
pnpm dev            # manual smoke test
```
`/jobs` checklist:
- [ ] Renders (CSV parser didn't throw on the 284-row file).
- [ ] **Reach `/jobs` via the nav LINK (View-Transition), not only a hard load** —
      filters + "load more" work (validates the VT fix).
- [ ] Light **and** dark: company accent = `--accent`; readable contrast.
- [ ] Nav active state on `/jobs` (desktop + mobile); **mobile Archives still the icon button.**
- [ ] Company / country / free-text filters; label + count update; clear works.
- [ ] "Load more" (+20, initial 100); empty-state when nothing matches.
- [ ] `view-source` shows the new `description` / `og:description`.
- [ ] Rest of site builds & renders: home, `/posts`, `/tags`, `/about`, `/events`,
      `/constitution`, `/archives`, `/search` (pagefind), RSS, sitemap.

## Open items / cleanup (post-landing)
- Delete the stale `narrative-job-board` / `narrative-job-board-jm` once the fix lands
  (their history carries the misleading downgrade) — optional.
- Sibling branches `job-postings` (Apr) and `jobs-tab` (Jun) are earlier jobs iterations
  superseded by this work — delete or keep for reference.
- CSV refresh cadence/ownership; confirm "build hard-fails on malformed CSV" is desired.
- `/jobs` nav order (currently last) — confirm or move (e.g. after Posts).
