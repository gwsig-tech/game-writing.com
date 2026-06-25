# Jobs data — schema normalization & build-time aggregation roadmap — Future feature

**Date:** 2026-06-26
**Branch:** TBD (do AFTER [jobs-board-reintegration](./2026-06-25-jobs-board-reintegration.md) lands)
**Author:** Jon (with Claude)
**Status:** Planned / deferred — documented as the direction for the jobs data layer. Not yet started.

> **Note — supersedes the earlier framing.** This doc previously proposed emitting `schema.org/JobPosting` JSON-LD on `/jobs` to surface the board in Google Jobs rich results. That was dropped: it's a *push/publish* model that conflicts with the board's "pull and list with links" intent, and (because `/jobs` is a list page whose links point off-site to the employer's own posting) it would have been non-compliant and duplicative anyway. The valuable, intent-aligned work is **normalizing our data to the leading standard** and building toward **live build-time aggregation**. On-page structured-data correctness is a separate, site-wide concern tracked in [2026-06-26-sitewide-jsonld-normalization.md](./2026-06-26-sitewide-jsonld-normalization.md).

## Scope

- **In scope:** internal data normalization (the data structure as built into the site) and a roadmap to live, automatic aggregation at build time.
- **Out of scope:** publishing job listings to external search engines / job aggregators. The board stays **pull-and-list with off-site apply links**; we do not submit listings anywhere.

## Goal

Adopt a single, well-defined data model for every listing, normalized to the **leading neutral standard** (`schema.org/JobPosting` vocabulary), so that (1) all sources are represented consistently, (2) duplicates across sources are detectable, and (3) the site can move from a manually-committed CSV to **live aggregation during the Vercel build** without changing how pages consume the data.

## (A) Normalize to the leading standard — near-term

Source rows come from `src/data/jobs/job_postings.csv` via [src/lib/jobs.ts](../../src/lib/jobs.ts) (the `JobPosting` type + helpers). Treat `schema.org/JobPosting` as the canonical vocabulary for our model — a vendor-neutral standard, used purely for *internal normalization*, not for publishing.

### Field mapping (our `JobPosting` → standard)

| schema.org/JobPosting | Source field | Notes |
|---|---|---|
| `title` | `title` | direct; never rewritten |
| `hiringOrganization.name` | `company_name` | the actual employer, not the SIG or the source board |
| `jobLocation.address` | `location` (+ `getJobCountries`) | derive `addressCountry`; for remote use `jobLocationType: "TELECOMMUTE"` + `applicantLocationRequirements` |
| `datePosted` | `first_seen_at` | ISO date |
| `validThrough` | — (not in data) | **policy needed**: e.g. `last_updated` + N days; never emit a stale/empty date |
| `employmentType` | `employment_type` | **normalize to the standard enum**: `FULL_TIME`/`PART_TIME`/`CONTRACTOR`/`TEMPORARY`/`INTERN`/`VOLUNTEER`/`PER_DIEM`/`OTHER`; default `OTHER` when unknown |
| `description` | `description` (responsibilities/qualifications/skills) | structured JSON today; keep as-is for rendering |
| `url` / apply link | `canonical_url` | points **off-site** to the third-party posting |
| `identifier` | `posting_id` | `@type: PropertyValue` |

### Deduplication

The cross-source dedup key is **`canonical_url` + `identifier` (`posting_id`)**. This is the internal answer to "won't aggregating from multiple sources create duplicates?" — the same role surfacing from two feeds collapses on these keys. Heavy scraping, enrichment (e.g. `writer_match_confidence`), and cross-source dedup stay in the sibling `narrative_job_board` service; the site's job is to **validate** the normalized shape on ingest and render it. Reuse the existing helpers in [src/lib/jobs.ts](../../src/lib/jobs.ts): `getActiveJobs`, `getJobCountries`, `getJobSummary`, `getExperienceLabel`, `getSourceLabel`.

## (C) Roadmap — live build-time aggregation on Vercel

The opportunity: stop hand-committing the CSV and instead pull fresh data automatically during each build. This is modeled directly on how the site **already** uses an external API at build time for the events calendar.

### Precedent — the Google Calendar API key (already in production)

[src/pages/events.astro](../../src/pages/events.astro) fetches the calendar at **build time** via `googleapis`, authed with `GOOGLE_CALENDAR_API_KEY`. That var is declared in [astro.config.ts](../../astro.config.ts) via `envField.string({ access: "secret", context: "server", optional: true })`, lives in `.env` locally and as a **Vercel environment variable**, and — because the site is SSG — the secret is read server-side at build and never reaches the client bundle. When the key is absent the page degrades gracefully (shows a message instead of crashing). The daily deploy-hook cron ([.github/workflows/scheduled-build.yml](../../.github/workflows/scheduled-build.yml)) re-runs the whole build, so the fetched data refreshes on a schedule. See the **Environment variables** section in [README.md](../../README.md) for the documented pattern.

### Today's jobs flow

Sibling `narrative_job_board` service scrapes sources → Neon → exports active rows to `src/data/jobs/job_postings.csv` → human reviews/commits/pushes → daily cron pings the Vercel deploy hook → build reads the committed CSV via `getActiveJobs()`. (See [src/data/jobs/README.md](../../src/data/jobs/README.md).)

### Target flow

1. The service exposes its export online (HTTP JSON/CSV endpoint).
2. Add `JOBS_SOURCE_URL` (and an optional `JOBS_API_KEY`) to the `astro.config.ts` env schema using the **same `envField` pattern as `GOOGLE_CALENDAR_API_KEY`** (`access: "secret"`, `context: "server"`, `optional: true`); set them in `.env` locally and as Vercel env vars.
3. Refactor `getActiveJobs()` into a **swappable source** behind one normalization + validation layer: committed file today, build-time `fetch(JOBS_SOURCE_URL)` later. Pages keep calling `getActiveJobs()` unchanged.
4. **Graceful fallback** (mirroring events.astro): if the fetch fails or the var is unset, fall back to the last committed CSV snapshot rather than failing the build.
5. The existing daily deploy-hook cron becomes the auto-refresh trigger — no manual CSV commit.

### Later

Add additional pull sources, all normalized through the same contract and deduped by `canonical_url` + `identifier`:

- **Per-company ATS feeds** (straight from the employer): Greenhouse (`boards-api.greenhouse.io`), Lever, Ashby, Workable, SmartRecruiters.
- **Aggregator APIs**: Adzuna, Remotive, Arbeitnow.

## Gaps to resolve before shipping (A)

1. **`validThrough` policy** — the CSV has no expiry; pick and document a rule (e.g. `last_updated` + N days). Never emit a stale or empty date.
2. **`employmentType` normalization** — map raw strings to the standard enum; default `OTHER`.
3. **Dedup ownership** — confirm dedup happens in the service (preferred) with the site validating; document the `canonical_url` + `identifier` key.

## Effort

(A) ~half a day (enum mapping, `validThrough` policy, validation). (C) is a larger, staged effort gated on the service exposing an online endpoint; the `getActiveJobs()` swappable-source refactor is the first concrete step and is isolated to [src/lib/jobs.ts](../../src/lib/jobs.ts) + the `astro.config.ts` env schema.
