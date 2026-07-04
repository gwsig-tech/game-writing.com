# Updating the jobs board

The `/jobs` page is built at build time by `src/lib/jobs.ts` from a **curated public Google Sheet** — the source of truth — with the committed `job_postings.csv` in this folder as a graceful fallback. The daily scheduled rebuild (`.github/workflows/scheduled-build.yml` → Vercel deploy hook) picks up sheet changes automatically; no commits are needed for routine posting updates.

## The sheet

- Spreadsheet: `game-writing-job-postings` (ID `1pRGDN0wj2ceuApldMNgjsp2AiJls-Z6OMI8IFESAzys`), shared as "Anyone with the link → Viewer".
- The build reads the **first visible tab** (it requests range `A1:Z` with no tab prefix, which the Sheets API resolves to the first visible sheet). Tabs may be renamed freely (e.g. dated names) — just keep the data tab first.
- The fetch uses `getPublicSheetValues()` (`src/lib/sheets.ts`) with `GOOGLE_SHEETS_API_KEY` — see the Environment Variables section of the root README. An API key can only read public data and can never write to the sheet; editing stays restricted to accounts with Editor access.

## Schema (the upstream contract)

Parsing is **header-name-based** (headers trimmed + lowercased), so column order doesn't matter to the site, unknown extra columns are ignored, and short rows are padded with empty strings. Current column order — `posting_id` leftmost as the key, content columns next, admin columns right:

| Column            | Type                                                                                                                      | Required | Consumed by                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `posting_id`      | string                                                                                                                    | no       | ignored by the site; reserved as the crawler's upsert key                             |
| `company_name`    | string                                                                                                                    | **yes**  | card, company facet, sort                                                             |
| `title`           | string                                                                                                                    | **yes**  | card, sort                                                                            |
| `canonical_url`   | URL                                                                                                                       | **yes**  | apply link                                                                            |
| `location`        | string                                                                                                                    | no       | card, country facet                                                                   |
| `employment_type` | lowercase vocab (advisory): `full-time`, `part-time`, `contract`, `freelance`, `internship`, `temporary`, `project-based` | no       | card                                                                                  |
| `remote_type`     | `remote` / `hybrid` / `onsite` (advisory)                                                                                 | no       | card                                                                                  |
| `minimum_years`   | integer                                                                                                                   | no       | "N+ years" label                                                                      |
| `salary_minimum`  | number                                                                                                                    | no       | pass-through, not rendered                                                            |
| `salary_maximum`  | number                                                                                                                    | no       | pass-through, not rendered                                                            |
| `summary`         | free text                                                                                                                 | no       | card two-line blurb, only when present                                                |
| `first_seen_at`   | date — `YYYY-MM-DD` preferred; full ISO/Postgres timestamps also parse                                                    | **yes**  | sort key, card date                                                                   |
| `last_updated`    | date (same formats)                                                                                                       | no       | "Listings updated" date on `/jobs` (max across rows, falling back to `first_seen_at`) |
| `is_active`       | `true`/`t`/`1`/`yes` = published; anything else (including blank) = hidden                                                | **yes**  | build filter                                                                          |

The vocabularies are advisory: unknown `employment_type`/`remote_type` values render as-is (the site lowercases them defensively), so upstream can evolve without breaking the build. Map CDI → `full-time` upstream.

## Validation: skip, don't fail

Rows missing a required field (or with an unparseable `first_seen_at`) are **skipped with a build-log warning**, not fatal — the sheet is human-edited and the rebuild runs unattended, so one typo must not fail the deploy. Soft-hide a posting by setting `is_active` to anything but a truthy value; delete rows only when pruning.

If the sheet yields **zero** active valid postings for any reason (missing key, fetch error, renamed headers, fumbled edit), the build logs a warning and falls back to the committed `job_postings.csv`, so a bad sheet state can never blank the live board — worst case is a stale-but-valid board.

## Refreshing the fallback CSV

```bash
pnpm jobs:snapshot   # fetches the sheet and overwrites src/data/jobs/job_postings.csv
```

Run occasionally (or after big sheet edits), review the diff, and commit. The fallback only needs to be plausible, not fresh — the live build reads the sheet directly.

## Provenance / future

Postings are curated by hand today: a separate crawler service identifies opportunities and its export is parsed and cleaned before being entered into the sheet. Eventually that service will push to the sheet directly (keyed on `posting_id`); the schema above is the contract both sides maintain. Deduplication is upstream's responsibility — the site renders whatever the sheet contains (dedup on `canonical_url` until `posting_id` is populated).
