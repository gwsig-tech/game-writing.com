# Updating the jobs board

The website builds `/jobs` from `job_postings.csv`. It does not connect to the
production database.

Running the sibling `narrative_job_board` service updates Neon with the complete
scrape payload, runs its heartbeat checks, and then exports active website fields
to this CSV. Keep the `game-writing.com` checkout on the
`narrative-job-board` branch when running the service, then review, commit, and
push the changed CSV.

The default destination is:

```text
../game-writing.com/src/data/jobs/job_postings.csv
```

Set `JOBS_CSV_PATH` in the service's `.env` to override it.

The build publishes rows whose `is_active` value is `true`, `t`, `1`, or `yes`.
It ignores inactive rows. The `description` column must remain valid JSON; a
standard database CSV export will quote and escape it correctly.

Required columns:

- `posting_id`
- `source`
- `company_name`
- `canonical_url`
- `title`
- `is_active`
- `first_seen_at`
- `last_updated`

The page also uses `project`, `location`, `employment_type`, `remote_type`,
`writer_match_confidence`, and `description` when they are available.
