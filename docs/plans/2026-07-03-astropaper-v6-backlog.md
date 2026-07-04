# AstroPaper v6 — post-migration backlog (2026-07-03)

This is the **active backlog** for the AstroPaper v6 work — the one place we look at to start tackling issues (we don't run Jira/Linear; this doc is that board for now, so items carry enough detail to start work directly from here). **Only items still to do.** History (what shipped, when, and why things were deferred) lives in [2026-06-28-astropaper-v6-parity-migration.md](./2026-06-28-astropaper-v6-parity-migration.md), not here — including the *Follow-up decisions (2026-07-03)* section explaining why item 3 (i18n) below (and the since-completed SeoJsonLd extraction) were reopened.

Settled decisions that will **not** be revisited as work items — custom Header/Footer/Breadcrumb/Tag/LinkButton — live in the migration doc's *Per-subsystem decisions* table. That one's a closed call with documented rationale, not a backlog item.

None of what's below is production-blocking. Pick any item up on `draft` — the repo is now a single working tree (the `jm-astropaper-v6` worktree was merged into `draft` and removed 2026-07-03).

---

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
