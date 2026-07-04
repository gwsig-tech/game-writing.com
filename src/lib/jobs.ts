import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPublicSheetValues } from "@/lib/sheets";

export type JobPosting = {
  posting_id: string | null;
  company_name: string;
  title: string;
  canonical_url: string;
  location: string | null;
  employment_type: string | null;
  remote_type: string | null;
  minimum_years: number | null;
  salary_minimum: number | null;
  salary_maximum: number | null;
  summary: string | null;
  first_seen_at: Date;
  last_updated: Date | null;
};

type CsvRow = Record<string, string>;

// The curated public Google Sheet is the source of truth; the committed CSV
// is a fallback snapshot (refresh with `pnpm jobs:snapshot`). The spreadsheet
// ID is public, not a secret (parity with CALENDAR_ID in events.astro).
const SPREADSHEET_ID = "1pRGDN0wj2ceuApldMNgjsp2AiJls-Z6OMI8IFESAzys";
// A range with no tab prefix resolves to the FIRST VISIBLE tab, so the
// date-named data tab keeps working as it gets renamed daily.
const SHEET_RANGE = "A1:Z";
const FALLBACK_CSV = resolve(process.cwd(), "src/data/jobs/job_postings.csv");

export type ActiveJobsResult = {
  jobs: JobPosting[];
  /**
   * When the listings data was last touched: the newest `last_updated`
   * (falling back to `first_seen_at`) across the returned rows. Data-derived
   * on purpose — it stays truthful whether the rows came from the live sheet
   * or the committed CSV snapshot, with no reliance on git metadata (Vercel's
   * shallow clone makes commit dates unreliable at build time).
   */
  updatedAt: Date | null;
};

/**
 * Loads active job postings when Astro builds the jobs pages: fetches the
 * sheet at build time, and falls back to the committed CSV snapshot whenever
 * the sheet yields nothing (missing key, fetch error, renamed headers, or a
 * fumbled edit) — a bad sheet state can never blank the live board.
 */
export async function getActiveJobs(): Promise<ActiveJobsResult> {
  const { rows, error } = await getPublicSheetValues({
    apiKey: import.meta.env.GOOGLE_SHEETS_API_KEY,
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_RANGE,
  });

  const sheetJobs = error ? [] : toActiveJobs(recordsFromRows(rows));
  if (sheetJobs.length > 0) return withUpdatedAt(sheetJobs);

  console.warn(
    `Jobs sheet yielded no active postings (${error ?? "no valid rows"}); ` +
      "falling back to the committed CSV snapshot."
  );
  const csv = await readFile(FALLBACK_CSV, "utf8");
  return withUpdatedAt(toActiveJobs(parseCsv(csv)));
}

function withUpdatedAt(jobs: JobPosting[]): ActiveJobsResult {
  const timestamps = jobs.map(job =>
    (job.last_updated ?? job.first_seen_at).valueOf()
  );
  return {
    jobs,
    updatedAt: timestamps.length ? new Date(Math.max(...timestamps)) : null,
  };
}

function toActiveJobs(rows: CsvRow[]): JobPosting[] {
  return rows
    .filter(row => parseBoolean(row.is_active))
    .map(toJobPosting)
    .filter((job): job is JobPosting => job !== null)
    .sort((a, b) => {
      const dateDifference =
        b.first_seen_at.valueOf() - a.first_seen_at.valueOf();
      return dateDifference || a.company_name.localeCompare(b.company_name);
    });
}

/** Maps a header row + data rows to records, padding short rows with "". */
function recordsFromRows(rows: string[][]): CsvRow[] {
  const [headers, ...dataRows] = rows;
  if (!headers) return [];

  return dataRows
    .filter(values => values.some(value => value.length > 0))
    .map(values =>
      Object.fromEntries(
        headers.map((header, index) => [
          header.trim().toLowerCase(),
          values[index] ?? "",
        ])
      )
    );
}

/**
 * Converts a row to a JobPosting, or null (with a warning) when required
 * fields are missing or invalid. The sheet is human-edited and the build runs
 * unattended daily, so one bad row must not fail the deploy.
 */
function toJobPosting(row: CsvRow): JobPosting | null {
  const requiredFields = ["company_name", "title", "canonical_url"] as const;

  for (const field of requiredFields) {
    if (!row[field]?.trim()) {
      warnSkippedRow(row, `missing required field: ${field}`);
      return null;
    }
  }

  const firstSeenAt = parseDate(row.first_seen_at);
  if (!firstSeenAt) {
    warnSkippedRow(row, `invalid first_seen_at: "${row.first_seen_at ?? ""}"`);
    return null;
  }

  return {
    posting_id: row.posting_id?.trim() || null,
    company_name: row.company_name.trim(),
    title: row.title.trim(),
    canonical_url: row.canonical_url.trim(),
    location: row.location?.trim() || null,
    employment_type: normalizeVocab(row.employment_type),
    remote_type: normalizeVocab(row.remote_type),
    minimum_years: parseNumber(row.minimum_years),
    salary_minimum: parseNumber(row.salary_minimum),
    salary_maximum: parseNumber(row.salary_maximum),
    summary: row.summary?.trim() || null,
    first_seen_at: firstSeenAt,
    last_updated: parseDate(row.last_updated),
  };
}

function warnSkippedRow(row: CsvRow, reason: string): void {
  const identity =
    [row.company_name, row.title].filter(Boolean).join(" — ") ||
    row.canonical_url ||
    "unidentified row";
  console.warn(`Skipping job posting (${identity}): ${reason}`);
}

/** Lowercases advisory-vocab fields (sheet data arrives mixed-case). */
function normalizeVocab(value: string | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

function parseDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseBoolean(value: string | undefined): boolean {
  return ["true", "t", "1", "yes"].includes(value?.trim().toLowerCase() ?? "");
}

/** Small RFC 4180 parser supporting quoted commas, quotes, and newlines. */
function parseCsv(input: string): CsvRow[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      if (record.some(value => value.length > 0)) records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("Job CSV contains an unclosed quoted field.");
  if (field || record.length) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }

  return recordsFromRows(records);
}

export function getJobSummary(job: JobPosting): string {
  return (job.summary || "").replace(/\s+/g, " ").trim();
}

export function getExperienceLabel(job: JobPosting): string | null {
  return job.minimum_years ? `${job.minimum_years}+ years` : null;
}

// ASCII-only markers; locations are diacritics-stripped before matching, so
// "MONTRÉAL" and "Malmö" match regardless of casing/accents. (Letters that
// don't NFD-decompose to ASCII, like Polish "ł", still rely on the row's
// country token — e.g. "Wrocław, … Poland" matches via "poland".)
const COUNTRY_MARKERS: Array<[string, string[]]> = [
  ["Belgium", ["belgium", "gent"]],
  ["Canada", ["canada", "montreal", "quebec"]],
  ["China", ["china", "beijing", "guangzhou"]],
  ["Finland", ["finland", "helsinki"]],
  ["France", ["france", "paris"]],
  // "georgia" itself is omitted — it collides with the US state.
  ["Georgia", ["tbilisi", "tblisi"]],
  ["Germany", ["germany", "munich", "berlin", "giebelstadt"]],
  ["Japan", ["japan", "tokyo"]],
  ["Poland", ["poland", "warsaw", "warszawa", "bielsko"]],
  ["South Korea", ["south korea", "seoul"]],
  ["Spain", ["spain", "barcelona"]],
  ["Sweden", ["sweden", "stockholm", "malmo"]],
  [
    "United Kingdom",
    [
      "united kingdom",
      " uk",
      "uk ",
      "brighton",
      "guildford",
      "manchester",
      "nottingham",
      "oxford",
      "warwick",
    ],
  ],
  [
    "United States",
    [
      "united states",
      "usa",
      "boston, ma",
      "california",
      "cincinnati",
      "irvine, ca",
      "new york city",
      "ohio",
      "san carlos",
    ],
  ],
];

/** Strips diacritics so accented locations match the ASCII markers. */
function stripDiacritics(value: string): string {
  // NFD splits accented letters into base + combining marks (U+0300–U+036F).
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getJobCountries(job: JobPosting): string[] {
  const location = job.location?.trim();
  if (!location) return ["Unspecified"];

  const normalized = ` ${stripDiacritics(location).toLowerCase().replace(/\s+/g, " ")} `;
  if (normalized.includes("remote (europe)")) return ["Europe"];
  if (normalized.trim() === "any") return ["Worldwide"];

  const countries = COUNTRY_MARKERS.filter(([, markers]) =>
    markers.some(marker => normalized.includes(marker))
  ).map(([country]) => country);

  return countries.length > 0 ? countries : ["Unspecified"];
}
