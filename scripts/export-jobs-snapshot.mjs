// Refreshes the committed jobs fallback CSV from the curated Google Sheet.
//
//   pnpm jobs:snapshot        (runs: node --env-file=.env scripts/export-jobs-snapshot.mjs)
//
// The live build fetches the sheet directly (src/lib/jobs.ts); this snapshot
// only serves as the graceful fallback when the sheet is unreachable, so it
// needs to be plausible, not fresh — refresh it occasionally or after big
// sheet edits, review the diff, and commit.

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { google } from "googleapis";

// Keep in sync with SPREADSHEET_ID / SHEET_RANGE in src/lib/jobs.ts.
const SPREADSHEET_ID = "1pRGDN0wj2ceuApldMNgjsp2AiJls-Z6OMI8IFESAzys";
const SHEET_RANGE = "A1:Z"; // no tab prefix -> first visible tab
const OUT = resolve(process.cwd(), "src/data/jobs/job_postings.csv");

const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
if (!apiKey) {
  console.error(
    "GOOGLE_SHEETS_API_KEY is not set — run via `pnpm jobs:snapshot` so it loads from .env."
  );
  process.exit(1);
}

/** RFC 4180 field escaping — matches the parser in src/lib/jobs.ts. */
function toCsvField(value) {
  const s = value ?? "";
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const sheets = google.sheets({ version: "v4", auth: apiKey });
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: SHEET_RANGE,
});
const rows = response.data.values ?? [];
if (rows.length < 2) {
  console.error(`Sheet returned ${rows.length} rows; refusing to overwrite.`);
  process.exit(1);
}

const csv = rows.map(row => row.map(toCsvField).join(",")).join("\n") + "\n";
await writeFile(OUT, csv, "utf8");
// eslint-disable-next-line no-console -- CLI success output belongs on stdout
console.log(`Wrote ${rows.length - 1} postings to ${OUT}`);
