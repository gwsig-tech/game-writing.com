# Jobs board: Google Sheet as source of truth (2026-07-04)

**Status: Shipped.**

## Decision

The `/jobs` board now builds from a **human-curated public Google Sheet** (`game-writing-job-postings`, ID `1pRGDN0wj2ceuApldMNgjsp2AiJls-Z6OMI8IFESAzys`), fetched at **build time** in `src/lib/jobs.ts` via `getPublicSheetValues()` (`src/lib/sheets.ts`) with `GOOGLE_SHEETS_API_KEY` — the same architecture as `events.astro`/Google Calendar. The committed `src/data/jobs/job-postings.csv` is retained as a graceful fallback snapshot, refreshed with `pnpm jobs:snapshot`. The daily scheduled rebuild (GH Actions cron → Vercel deploy hook) picks up sheet edits with no commits.

This decouples the site from the crawler pipeline: the separate crawl/relevancy/database service no longer feeds the site directly. Its export is parsed and cleaned upstream before entering the sheet; humans review/edit in the sheet; the site renders what the sheet says. The old 15-column database export (nested-JSON `description` column, `source`/`writer_match_confidence`/`project` etc.) is gone — the previous export format is preserved in git history under `src/data/jobs/job_postings.csv` prior to this change.

## Schema

The canonical 14-column schema is documented in `src/data/jobs/README.md` (kept there as the living upstream contract; this doc records the rationale):

- **`posting_id` leftmost** — conventional key position; the crawler's future upsert anchor (currently blank; dedup keyed on `canonical_url` until populated).
- Required: `company_name`, `title`, `canonical_url`, `first_seen_at`, `is_active`. Everything else optional.
- `employment_type`/`remote_type` vocabularies are **advisory** — the site lowercases defensively and renders unknown values as-is, so upstream can evolve without site changes ("less opinionated" by design).
- `salary_minimum`/`salary_maximum` are pass-through: carried in the contract, not rendered (no change to the card).
- Parsing is header-name-based; unknown columns ignored; short rows padded. Column order is irrelevant to the site.

## Key design choices

- **Skip-with-warn, not throw** (change from the old parser): rows with missing required fields or unparseable dates are skipped with a build-log warning. The sheet is human-edited and the rebuild runs unattended daily — one typo must not fail the deploy. Throwing suited the old machine export; it doesn't suit curated data.
- **Empty-result guard:** if the sheet path yields zero active valid postings for any reason (missing key, API error, renamed headers, fumbled edit), the build warns and falls back to the committed CSV. A bad sheet state can never blank the live board; worst case is stale-but-valid. Accepted consequence (surfaced in the 2026-07-05 pre-merge review): the board cannot be *intentionally* emptied via the sheet alone — setting every row's `is_active` to false trips the fallback and resurrects the snapshot, so truly taking the board down also requires blanking the committed CSV.
- **Review-driven tweaks (2026-07-05 pre-merge review):** the lib-level sort was removed from `toActiveJobs` — its sole consumer (`jobs.astro`) re-sorts by company/title, so ordering is the page's concern; and card dates are pinned to `timeZone: "UTC"` to match the "Listings updated" line — `first_seen_at` is a bare date parsed as UTC midnight, and non-UTC build hosts rendered it a day early.
- **Tab-name independence:** the loader requests range `A1:Z` with no tab prefix, which the Sheets API resolves to the **first visible tab** — so the date-named tab can be renamed daily with zero config. Rule: keep the data tab first-visible.
- **Spreadsheet ID is a constant** in `jobs.ts` (parity with `CALENDAR_ID` in `events.astro`). It's public (visible in the sheet URL), not a secret; an env var would add config surface for nothing.
- **API key, not service account:** the sheet is public-read ("Anyone with link → Viewer"), and an API key can only read public data — it cannot write, so edit control stays entirely with the sheet's Editor grants.
- **Diacritics fix landed** (was a documented deferral since 2026-06-28): `getJobCountries` now NFD-strips combining marks and the `COUNTRY_MARKERS` are ASCII-only, so `MONTRÉAL`/`Malmö` match in any casing/normalization. Letters that don't decompose to ASCII (Polish `ł`) still rely on the row's country token, as before.

## Future

- Crawler service pushes directly to the sheet (upsert keyed on `posting_id`) once its normalization/accuracy improves; the schema is not expected to change.
- Dedup remains upstream's responsibility; the current data has duplicate `canonical_url` rows the curation pass should collapse.
- **Curated `country` column** (follow-up from the 2026-07-05 review): country facets currently come from a hardcoded city→country gazetteer (`COUNTRY_MARKERS` in `src/lib/jobs.ts`), so a posting in an unlisted city facets as "Unspecified" until someone edits TS and redeploys — cutting against "no commits needed for routine posting updates." The deeper fix is a curated `country` column in the sheet (schema addition, upstream + site change); the gazetteer then becomes a fallback for rows without one.
- If the first-visible-tab convention ever misfires (a scratch tab reordered to front), harden the loader to reference an explicit tab name or gid instead.
