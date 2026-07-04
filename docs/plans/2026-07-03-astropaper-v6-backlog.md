# AstroPaper v6 — post-migration backlog (2026-07-03)

This is the **active backlog** for the AstroPaper v6 work — the one place we look at to start tackling issues (we don't run Jira/Linear; this doc is that board for now, so items carry enough detail to start work directly from here). **Only items still to do.** History (what shipped, when, and why things were deferred) lives in [2026-06-28-astropaper-v6-parity-migration.md](./2026-06-28-astropaper-v6-parity-migration.md), not here — including the *Follow-up decisions (2026-07-03)* section explaining why item 3 (i18n) below (and the since-completed SeoJsonLd extraction) were reopened.

Settled decisions that will **not** be revisited as work items — custom Header/Footer/Breadcrumb/Tag/LinkButton — live in the migration doc's *Per-subsystem decisions* table. That one's a closed call with documented rationale, not a backlog item.

None of what's below is production-blocking. Pick any item up on `draft` — the repo is now a single working tree (the `jm-astropaper-v6` worktree was merged into `draft` and removed 2026-07-03).

---

## Dependencies between items — what's stacked, what isn't

- **#4 (CI activation) is no longer blocked.** Its former blocker — repo-wide `format:check` failures (old item #6) — was resolved 2026-07-03: `printWidth` was reverted 9999→80 (matching upstream, which the files already conformed to), line endings normalized to LF, and a one-time repo-wide format pass applied (commits `ef0af53`, `f0eb1d7`). `pnpm run format:check` now passes clean across the whole repo, so turning on the `pull_request` trigger won't produce red checks unrelated to a PR's own diff. #4 is now purely the maintainer judgment call in the item below (is a standalone lint/format CI signal worth it alongside Vercel's build?), with no formatting prerequisite left.
- **#5 (pnpm 11 / `allowBuilds`) touches the same file (`ci.yml`) as #4 but isn't blocked by it.** Whether or not the PR-gate trigger is ever added, upgrading pnpm means bumping `ci.yml`'s pinned `pnpm/action-setup@v4 version: "10.15.1"` too. Do that update whenever #5 happens, independent of #4's outcome.
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

## 4. CI activation as a PR gate

- **What it is, concretely:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) already exists and runs `pnpm install --frozen-lockfile` → `pnpm run lint` → `pnpm run format:check` → `pnpm run build` on Ubuntu with Node 22 + pnpm 10.15.1. Today it only runs when someone manually triggers it from the GitHub Actions tab (`on: workflow_dispatch`). "Activating" it means adding a `pull_request:` trigger so it runs automatically on every PR and becomes a required/visible status check.
- **The case for it:** a PR-gate CI check that's independent of Vercel catches lint/format/type errors *before* merge, with GitHub's native PR UI (red X / green check) rather than having to go check a Vercel deploy log. It also protects against the case where Vercel's build config drifts from what `pnpm build` actually does locally (unlikely today, but CI is the traditional insurance against that class of problem).
- **The case against it:** Vercel's GitHub integration already builds and comments on every PR/push — `pnpm run build` (the expensive, meaningful part of this workflow) is already effectively gated. Adding a second, separate CI build for the same `pnpm build` step is redundant compute for the core check; the only *net-new* value over what Vercel already gives us is `lint` + `format:check` running as an explicit named status.
- **Former blocker, now cleared:** repo-wide `format:check` failures (old item #6) used to make this a non-starter — turning the gate on would have shown a failing check on every PR unrelated to its own diff. Resolved 2026-07-03 (printWidth→80 + LF normalization + one-time format pass, commits `ef0af53`/`f0eb1d7`); `format:check` now passes clean, so the gate can be turned on freely.
- **Recommendation:** this is a genuine judgment call, not an obviously-correct default — flag it as a maintainer decision rather than "obviously do it" or "obviously skip it." If the answer ends up being "not worth it, Vercel already covers the meaningful part" — that's a legitimate outcome; update this item to record that decision and stop carrying it as open work. If the answer is "yes, we want the standalone lint/format signal" — the formatting prerequisite (old #6) is already resolved, so just add the trigger block and bump the pinned pnpm version to match whatever #5 lands on.
- **Effort:** ~15 min (just adding the trigger block already commented in the file); ~0 min to instead formally decide against it and close this out.

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
  - `ci.yml`'s `pnpm/action-setup@v4` step is pinned to `version: "10.15.1"` — bump this alongside the workspace-file change (see the note in the *Dependencies* section above: do this regardless of what happens with #4).
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
