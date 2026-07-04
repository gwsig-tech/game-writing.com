# AstroPaper v6 — post-migration backlog (2026-07-03)

This is the **active backlog** for the AstroPaper v6 work — the one place we look at to start tackling issues (we don't run Jira/Linear; this doc is that board for now, so items carry enough detail to start work directly from here). **Only items still to do.** History (what shipped, when, and why things were deferred) lives in [2026-06-28-astropaper-v6-parity-migration.md](./2026-06-28-astropaper-v6-parity-migration.md), not here — including the *Follow-up decisions (2026-07-03)* section explaining why item 3 (i18n) below (and the since-completed SeoJsonLd extraction) were reopened.

Settled decisions that will **not** be revisited as work items — custom Header/Footer/Breadcrumb/Tag/LinkButton — live in the migration doc's *Per-subsystem decisions* table. That one's a closed call with documented rationale, not a backlog item.

None of what's below is production-blocking. Pick any item up on `draft` — the repo is now a single working tree (the `jm-astropaper-v6` worktree was merged into `draft` and removed 2026-07-03).

---

## Dependencies between items — what's stacked, what isn't

- **#5 (pnpm 11 / `allowBuilds`) also touches `ci.yml`.** Upgrading pnpm means bumping `ci.yml`'s pinned `pnpm/action-setup@v4 version: "10.15.1"` too — do that as part of #5 whenever it happens.
- **#7 (Decision B) is independent of everything above, with one soft note:** if #3 (i18n) ever gets real engineering traction, do #7 *after* starting it rather than before — a centralized title-suffix helper is easy to design locale-aware from day one, but would likely need a revisit if it's built first and locale support lands later. Not a hard blocker; just sequencing advice if both happen to be in flight at once.
- **#1 (example post refresh) is fully independent** — pure content task, touches only `draft:true` reference posts.

---

## 1. Example / reference post refresh (content task)

- **What:** our `src/content/posts/examples/` posts are still the v5.5.1-era versions. v6 rewrote them (MD→MDX, `<ResponsiveTable>`, callouts, new-config docs). The v6 **release post `_releases/astro-paper-6.md` was pulled**; the 10 examples were **not**.
- **Why deferred:** each upstream example references v6 demo images — ~13 assets across **4 path conventions** (`@/assets`, `../../assets`, `assets/`, `/assets`) — and needs per-post review (several document stock v6's 7-token palette, which differs from ours). It's a content task, not a mechanical pull, and a sloppy pull breaks the build (missing-image schema errors, even for drafts).
- **How:** pull each example from `upstream/main` (paths listed in the migration doc's *Content sync* section), pull its referenced images to the matching relative locations, set `draft: true`, then `pnpm build` + confirm routes unchanged. `ResponsiveTable` is already registered in the post `<Content components>`; `rehype-callouts` is already wired — so the pulled MDX will render correctly.
- **Effort:** ~0.5–1d (content).

## 3. i18n / locale readiness (`withBase` + full locale support)

- **What / why this matters:** IGDA is the **International** Game Developers Association. The original 2026-06-28 audit treated `withBase`/locale routing as a pure no-op to defer (single locale, no base path) without weighing whether the SIG might actually want non-English content someday — that's a real possibility for this org, not a hypothetical one, so it's worth scoping properly now rather than leaving it as an unexamined "someday."
- **Where we actually stand today** (this is more done — and more not-done — than the one-line backlog description ever conveyed):
  - `astro.config.ts` already has the full `i18n` block (`locales: ["en"]`, `defaultLocale: "en"`, `prefixDefaultLocale: false`) — the routing scaffold exists.
  - `src/i18n/lang/en.ts` already has **75 lines of UI strings scaffolded**, including keys for our custom nav (`nav.events`, `nav.constitution`, `nav.jobs`), footer (`footer.copyright`, `footer.allRightsReserved`), page titles/descriptions (`pages.*Title`/`pages.*Desc`), and accessibility labels (`a11y.skipToContent`, `a11y.openMenu`, `a11y.toggleTheme`, etc.) — but only **5 files actually consume them** via `useTranslations()`: `Datetime.astro`, and the post-detail components `AdjacentPostNav`, `BackButton`, `EditPost`, `ShareLinks`. Concretely: `Header.astro` has hardcoded `"Events"`/`"Constitution"`/`"Jobs"`/`"About"` etc. even though `t.nav.events`/`t.nav.constitution`/`t.nav.jobs` already exist unused in `en.ts`.
  - `getPostPaths.ts`'s `getPostUrl` already uses `getRelativeLocaleUrl` (adopted in the 2026-07-03 polish round) — one URL call site is locale-aware today.
  - Everything else — `Header.astro`, `Tag.astro`, `Breadcrumb.astro`, `Card.astro`, `rss.xml.ts`, `jobs.astro`, `events.astro`, the sitemap — uses hardcoded root-relative paths (`/tags/`, `/posts/`, `/about`, etc.) and hardcoded English strings.
- **This is not one task — it's three tiers of very different size and owner:**

  **Tier 1 — mechanical plumbing (real engineering work, safely doable now, no product decision needed):**
  - Wire the *already-scaffolded-but-unused* `t.nav.*`/`t.footer.*`/`t.a11y.*` keys into `Header.astro` and `Footer.astro` (zero new string authoring — the keys exist, just aren't consumed).
  - Sweep hardcoded hrefs (`Header`, `Tag`, `Breadcrumb`, `Card`, `rss.xml.ts`, sitemap) to `getRelativeLocaleUrl`/upstream's `withBase.ts` pattern (`stripBase`/`stripLocale`/`getAssetPath`), mirroring what `getPostPaths.ts` already does for post URLs.
  - Author the *missing* keys for our custom features that have none today: jobs board UI strings, events page UI strings.
  - This tier is genuinely a no-op in output today (single locale, no base path) — it's prep work, verified by confirming the built route set and rendered strings are unchanged.
  - **Effort:** ~1–2d.

  **Tier 2 — actual content localization (a content-operations decision, not an engineering one):**
  - Translating 36+ published MDX posts, restructuring `src/content/posts/` into per-locale subfolders (the standard Astro pattern is `src/content/posts/en/`, `src/content/posts/fr/`, etc. — itself a directory move comparable in shape to the `src/data/blog`→`src/content/posts` move we already did once), and deciding a fallback policy for untranslated posts (show in English? hide? show a "not yet translated" note?).
  - Sveltia CMS needs its own multi-locale collection config (`i18n` structure) so editors can add translations through the normal editorial workflow — nontrivial CMS reconfiguration, separate from the Astro-side routing.
  - SEO: `hreflang` tags, per-locale sitemaps, per-locale RSS feeds.
  - **This tier cannot start from an engineering decision alone.** It needs SIG leadership to decide: which language(s) first, who translates and reviews, whether translation is mandatory-before-publish or best-effort/lagging, and whether the jobs board / events calendar (both external-data-driven, not authored content) stay English-only — a reasonable default, since job postings and calendar entries are commonly kept in their original submitted language even on multilingual sites.
  - **Effort:** unbounded / ongoing — this is a program, not a sprint item. Don't schedule it as if it were.

  **Tier 3 — nice-to-have, once Tier 2 exists:** a language switcher UI, locale-aware date/number formatting refinement (`src/i18n/format.ts` already exists as a landing spot for this), and per-locale OG images.

- **Recommendation:** do Tier 1 opportunistically and cheaply (it's good hygiene regardless — it stops new hardcoded-path debt from accumulating, and several files already half expect it). **Do not start Tier 2** until there's an explicit decision from SIG leadership on scope (languages, translation workflow, jobs/events policy) — that decision is the actual trigger for this item, not a calendar date or an engineering itch.

## 5. `pnpm-workspace.yaml` → pnpm 11 (`onlyBuiltDependencies` → `allowBuilds`)

- **What's changed since this was last looked at:** the original backlog framing was "migrate `onlyBuiltDependencies` → `allowBuilds` only when/if the repo moves to pnpm 11" — as if pnpm 11 wasn't real yet. It is: **pnpm 11.9.0 is out now**, and it requires **Node.js 22+**, which we already require (`engines.node: ">=22.12.0"` in `package.json`, driven by Astro 6's own floor) — so the Node-version gate that would've blocked this is already satisfied. The remaining work is genuinely just "do the mechanical config migration," not "wait for a prerequisite."
- **What the migration actually involves** (checked against pnpm's own [v10→v11 migration guide](https://pnpm.io/migration) and [11.0 release notes](https://pnpm.io/blog/releases/11.0)):
  - `onlyBuiltDependencies`, `neverBuiltDependencies`, `ignoredBuiltDependencies`, and `onlyBuiltDependenciesFile` are all removed and merged into one `allowBuilds` map (`{ name: true | false }`). Our current `pnpm-workspace.yaml` only uses `onlyBuiltDependencies` for 3 packages (`@tailwindcss/oxide`, `esbuild`, `sharp`), so the concrete change is:
    ```yaml
    # before
    onlyBuiltDependencies:
      - '@tailwindcss/oxide'
      - esbuild
      - sharp
    # after
    allowBuilds:
      '@tailwindcss/oxide': true
      esbuild: true
      sharp: true
    ```
  - pnpm ships an official codemod for the bulk of this: `pnpx codemod run pnpm-v10-to-v11`.
  - We have no `.npmrc` (confirmed) and no `packageManager` field pinning a pnpm version in `package.json`, so the "settings move out of `.npmrc`/`package.json#pnpm` into `pnpm-workspace.yaml`" restructuring that trips up other repos doesn't apply to us — smaller surface than a typical migration.
  - `ci.yml`'s `pnpm/action-setup@v4` step is pinned to `version: "10.15.1"` — bump this alongside the workspace-file change (see the note in the *Dependencies* section above).
  - New pnpm 11 defaults worth knowing about, not necessarily blockers: a 1-day minimum release-age supply-chain check on newly published packages (could matter if we ever `pnpm add` something within a day of its release), and the store format changing to a SQLite-backed v11 store (one-time re-resolve cost on first install after upgrading, not an ongoing one).
  - Confirm how Vercel resolves the pnpm version for the production build (we don't pin one via `packageManager`) — worth a quick check in the Vercel project settings as part of this work, so the deployed build actually uses pnpm 11 too rather than silently staying on whatever Vercel defaults to.
- **Risk:** low-to-moderate — mechanical config change with an official codemod, but touches the dependency-install pipeline, so verify with a full `pnpm install` (fresh, no cache) + `pnpm build` locally and via the manual CI trigger before relying on it.
- **Effort:** ~0.5d (run the codemod, verify the 3-package mapping, update `ci.yml`'s pinned version, confirm Vercel's pnpm resolution, full clean install + build check).

## 7. Decision B — centralize the `` | ${config.site.title} `` title suffix

- **What / background:** every page currently hand-applies the ` | Site Title` suffix at its own call site — 10 of them today: `404.astro`, `archives/index.astro`, `events.astro`, `jobs.astro`, `posts/[...page].astro`, `posts/[...slug]/index.astro`, `search.astro`, `tags/index.astro`, `tags/[tag]/[...page].astro`, and `DefaultLayout.astro`. "Decision B" is whether to centralize that suffix into `Layout.astro` itself (e.g., pages pass a bare `title` and `Layout` appends the suffix once, in one place) instead of repeating `` `${title} | ${config.site.title}` `` at every call site.
- **Are we still considering this?** Yes — this is specifically what the original doc said to revisit. Full context lives in [2026-06-27-page-meta-descriptions.md](./2026-06-27-page-meta-descriptions.md) (the "B / C / D" decision doc from before the v6 migration): decision **C** (per-page descriptions) shipped, decision **D** (restructuring `Main` to own the Layout/Header/Footer shell) was rejected outright, and decision **B** (this one) was explicitly **deferred with an instruction to revisit it after v6 cutover** — "so the work isn't thrown away." v6 has now shipped to production (PR #16 → `draft`, PR #17 → `main`), so per that doc's own terms, **now is the intended time to reconsider it** — it was never a "maybe never," it was "not yet."
- **Why it was deferred originally, in case it still applies:** centralizing it would have been a net-new divergence from *both* stock v5.5.1 and v6 (both hand-apply the suffix the same way we do), for marginal benefit, and would've been thrown away by the v6 port regardless. That specific reason (v6 port risk) no longer applies now that v6 has shipped — the remaining question is purely "is the duplication itself worth centralizing," independent of any port risk.
- **Note the original doc's own caveat, still true:** this is *not* about the `title`/`pageTitle` drift bug class (a real historical incident — a wrong page *name*, not a suffix problem) — centralizing the suffix wouldn't have prevented that. `title` (tab/SEO) and `pageTitle` (visible `<h1>`) remain intentionally independent fields the theme allows to differ; a naive "derive `title` from `pageTitle`" shortcut isn't automatically safe and isn't what this item is about.
- **Recommendation:** low priority, low risk either way — this is “clean up 10 duplicated string interpolations” with no user-facing effect and no bug behind it. Fine to leave open indefinitely; a good pick when someone wants a small, safe, well-scoped task, not something to schedule proactively. See the sequencing note above if #3 (i18n) is in flight at the same time.
- **Effort:** ~30 min–1hr (10 call sites + `Layout.astro`).

## 8. Make the CI check a required merge gate (GitHub branch protection)

- **What:** the `ci.yml` lint + `format:check` workflow (added 2026-07-03, commit `640072a`) runs on every PR into `main`/`draft` and reports a green/red **"Code standards (lint + format)"** status — but today it's **advisory only**: a red check doesn't stop a merge. Making it an enforced gate (merge button disabled until the check is green) is a per-branch **branch-protection** setting in the GitHub web UI. It does *not* live in the repo and can't be committed here — it has to be switched on in GitHub, and only after everything's pushed.
- **Prerequisite (why "once it's pushed"):** GitHub only lets you select a status check as *required* after it has **reported at least once** on the repo — the check name won't appear in the picker before its first run. So push `main`/`draft`, let one real PR trigger the workflow, *then* configure the rule.
- **How (GitHub web UI):**
  1. Repo **Settings → Branches** (under *Code and automation*) → **Add branch ruleset** (or "Add rule" under the classic *Branch protection rules*).
  2. Target branch pattern: `main` (production). Repeat for `draft`, or use one ruleset targeting both — see the scope note.
  3. Enable **Require status checks to pass before merging**, then search for and add the check — it appears as **"Code standards (lint + format)"** (possibly prefixed with the workflow name, e.g. `CI / Code standards (lint + format)`). Optionally also enable **Require branches to be up to date before merging**.
  4. Save. From then on, a red lint/format check disables the merge button on PRs into that branch.
- **Scope note — which branches to enforce:** this only gates **PRs**. Direct pushes to `draft` (Sveltia CMS content commits) bypass PR checks by design, so enforcing on `draft` only affects the feature-branch → `draft` PR path, not CMS commits. Reasonable options: enforce on `main` only (protect production, keep the `draft`/preview flow frictionless), enforce both, or leave both advisory and rely on the visible red/green signal.
- **Effort:** ~5 min in the GitHub UI, once a PR has triggered the workflow at least once.
