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
const FALLBACK_CSV = resolve(process.cwd(), "src/data/jobs/job-postings.csv");

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

// Row order is preserved as-is; ordering is the consuming page's concern
// (jobs.astro sorts by company/title).
function toActiveJobs(rows: CsvRow[]): JobPosting[] {
  return rows
    .filter(row => parseBoolean(row.is_active))
    .map(toJobPosting)
    .filter((job): job is JobPosting => job !== null);
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

// Location → country classification for the /jobs country filter.
//
// `location` is free text aggregated from many job boards, so rows arrive as
// "City", "City, Country", country-first ("Cyprus, Limassol"), region-only
// ("Europe", "Worldwide"), and multi-location lists with assorted separators
// ("Warsaw, Poland | Malmö, Sweden", "Barcelona; Helsinki", "USA / Canada").
// Classification is whole-word marker matching over a normalized form of the
// ENTIRE string — every marker the row mentions contributes its country, so
// multi-location rows land under each of their countries with no
// delimiter-specific handling. The full contract (and the cleanup we want the
// upstream data services to take over) is docs/jobs-location-parsing.md.
//
// Markers must be written pre-normalized: lowercase ASCII words separated by
// single spaces (the form normalizeLocation produces). City markers exist
// only for cities that appear upstream WITHOUT a country token; don't add
// city names that are ambiguous across countries (London, Cambridge,
// Ontario…). Letters that don't NFD-decompose to ASCII (e.g. Polish "ł")
// normalize to a word break, so "Wrocław" itself is unmatchable and relies on
// the row's "Poland" token.
const COUNTRY_MARKERS: Array<[string, string[]]> = [
  ["Armenia", ["armenia", "yerevan"]],
  ["Belarus", ["belarus", "minsk"]],
  ["Belgium", ["belgium", "gent"]],
  ["Canada", ["canada", "montreal", "quebec", "toronto", "vancouver"]],
  ["China", ["china", "beijing", "guangzhou"]],
  ["Cyprus", ["cyprus", "limassol"]],
  ["Denmark", ["denmark", "copenhagen"]],
  ["Finland", ["finland", "helsinki"]],
  ["France", ["france", "paris", "bordeaux"]],
  // "georgia" itself is omitted — it collides with the US state.
  ["Georgia", ["tbilisi", "tblisi"]],
  ["Germany", ["germany", "munich", "berlin", "giebelstadt"]],
  ["India", ["india"]],
  ["Indonesia", ["indonesia", "jakarta"]],
  ["Japan", ["japan", "tokyo"]],
  // Safe as a whole word only because normalizeLocation rewrites the US
  // state "new mexico" before matching.
  ["Mexico", ["mexico"]],
  ["Poland", ["poland", "warsaw", "warszawa", "bielsko"]],
  ["Romania", ["romania", "bucharest"]],
  ["Serbia", ["serbia", "belgrade"]],
  ["South Korea", ["south korea", "seoul"]],
  ["Spain", ["spain", "barcelona"]],
  ["Sweden", ["sweden", "stockholm", "malmo"]],
  ["Ukraine", ["ukraine", "kyiv", "kiev"]],
  [
    "United Kingdom",
    [
      "united kingdom",
      "uk",
      "england",
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
      "boston ma",
      "california",
      "cincinnati",
      "irvine ca",
      "los angeles",
      "new york city",
      "ohio",
      "san carlos",
      "santa monica",
    ],
  ],
  ["Vietnam", ["vietnam", "ho chi minh"]],
  // Regions, for rows broader than one country ("Europe", "Remote (Europe)",
  // "North America / Canada / Europe", "Worldwide", "Any"). Whole-word
  // matching keeps "any" from firing inside e.g. "Germany".
  ["Europe", ["europe"]],
  ["North America", ["north america"]],
  ["South America", ["south america"]],
  ["Worldwide", ["worldwide", "any"]],
];

/** Strips diacritics so accented locations match the ASCII markers. */
function stripDiacritics(value: string): string {
  // NFD splits accented letters into base + combining marks (U+0300–U+036F).
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Canonicalizes a location for marker matching: strips diacritics,
 * lowercases, and reduces every punctuation/separator run (commas, pipes,
 * semicolons, slashes, parens, hyphens…) to a single space, then pads with
 * spaces so ` marker ` comparisons match whole words only ("india" can never
 * fire inside "Indiana", nor "uk" inside "Ukraine").
 */
function normalizeLocation(value: string): string {
  const words = stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  // "New Mexico" is a US state — rewrite it so the "mexico" marker can't
  // claim it for Mexico.
  return ` ${words.replace(/\bnew mexico\b/g, "united states")} `;
}

export function getJobCountries(job: JobPosting): string[] {
  const location = job.location?.trim();
  if (!location) return ["Unspecified"];

  const normalized = normalizeLocation(location);
  const countries = COUNTRY_MARKERS.filter(([, markers]) =>
    markers.some(marker => normalized.includes(` ${marker} `))
  ).map(([country]) => country);

  return countries.length > 0 ? countries : ["Unspecified"];
}
