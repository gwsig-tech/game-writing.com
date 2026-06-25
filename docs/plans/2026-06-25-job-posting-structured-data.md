# Jobs Board — `JobPosting` structured data (JSON-LD) — Future feature

**Date:** 2026-06-25
**Branch:** TBD (do AFTER [jobs-board-reintegration](./2026-06-25-jobs-board-reintegration.md) lands)
**Author:** Jon (with Claude)
**Status:** Planned / deferred — documented as the next jobs feature. Not yet started.

## Goal

Emit `schema.org/JobPosting` JSON-LD per listing on [/jobs](../../src/pages/jobs.astro) so search engines can surface the board in Job rich results / Google Jobs and so shared links carry richer metadata. Currently the page emits no per-listing structured data (the shared `Layout` emits a generic `BlogPosting`, which is wrong for this page).

## Data we have → `JobPosting` field mapping

Source rows come from `src/data/jobs/job_postings.csv` via [src/lib/jobs.ts](../../src/lib/jobs.ts) (`JobPosting` type + helpers).

| schema.org/JobPosting | Source | Notes |
|---|---|---|
| `title` | `title` | direct |
| `hiringOrganization.name` | `company_name` | `@type: Organization` |
| `jobLocation.address` | `location` (+ `getJobCountries`) | derive `addressCountry`; for remote use `jobLocationType: "TELECOMMUTE"` + `applicantLocationRequirements` |
| `datePosted` | `first_seen_at` | ISO date |
| `validThrough` | — (NOT in data) | **needs a policy** (e.g. `first_seen_at` + N days, or `last_updated` + N days). Google treats expired/absent dates poorly. |
| `employmentType` | `employment_type` | **normalize to Google enum**: `FULL_TIME`/`PART_TIME`/`CONTRACTOR`/`TEMPORARY`/`INTERN`/`VOLUNTEER`/`PER_DIEM`/`OTHER` |
| `description` | `description` (responsibilities/qualifications/skills) | **must be non-trivial HTML/text** per Google policy; some rows are sparse |
| `url` / apply link | `canonical_url` | points OFF-SITE (third-party posting) |
| `identifier` | `posting_id` | `@type: PropertyValue` |

## Where to emit

Build the JSON-LD in `jobs.astro` frontmatter (server-rendered) and inject one `<script type="application/ld+json">` per active job — or a single `ItemList` wrapping them — via `set:html={JSON.stringify(payload)}`. Keep it SSG (no client JS). Reuse `getActiveJobs()`, `getJobCountries()`, `getJobSummary()` already in `src/lib/jobs.ts`.

## Gaps to resolve before shipping

1. **`validThrough` policy** — the CSV has no expiry. Pick a rule (e.g. drop the field, or `datePosted + 60d`) and document it; do not emit stale dates.
2. **`employmentType` normalization** — map raw CSV strings to Google's enum; default to `OTHER` when unknown.
3. **`description` quality** — Google requires a real description; gate emission to rows with sufficient content (consider also gating on `writer_match_confidence`).
4. **Third-party aggregation caveat (IMPORTANT)** — these are public postings *collected* by the SIG, not first-party listings, and `url` points off-site. Review Google's JobPosting guidelines for **aggregators / third-party content** before shipping — rich-result eligibility may not apply, and mis-declaring first-party listings could be a policy issue. Decide whether structured data is appropriate here at all, or only for a curated/high-confidence subset.

## Validation

- Google **Rich Results Test** + the schema.org validator on a built `/jobs` page.
- Confirm no duplicate/conflicting structured data with the `Layout`'s default schema (may need to suppress the generic `BlogPosting` on this route).

## Effort

~half a day including enum mapping, `validThrough` policy, description sanitization, and validation. Isolated to `jobs.astro` (+ small helpers in `src/lib/jobs.ts`); no new deps.
