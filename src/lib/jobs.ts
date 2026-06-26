import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type JobDescription = {
  responsibilities?: string | null;
  qualifications?: string | null;
  salary_range?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
  } | null;
  technical_details?: {
    minimum_years?: number | null;
    skills?: string[] | null;
    languages?: string[] | null;
  } | null;
};

export type JobPosting = {
  posting_id: string;
  source: string;
  company_name: string;
  canonical_url: string;
  title: string;
  project: string | null;
  location: string | null;
  employment_type: string | null;
  remote_type: string | null;
  writer_match_confidence: number | null;
  first_seen_at: Date;
  last_updated: Date;
  description: JobDescription;
};

type CsvRow = Record<string, string>;

const JOBS_CSV = resolve(process.cwd(), "src/data/jobs/job_postings.csv");

/** Loads the committed database export when Astro builds the jobs pages. */
export async function getActiveJobs(): Promise<JobPosting[]> {
  const csv = await readFile(JOBS_CSV, "utf8");

  return parseCsv(csv)
    .filter(row => parseBoolean(row.is_active))
    .map(toJobPosting)
    .sort((a, b) => {
      const dateDifference =
        b.first_seen_at.valueOf() - a.first_seen_at.valueOf();
      return dateDifference || a.company_name.localeCompare(b.company_name);
    });
}

function toJobPosting(row: CsvRow): JobPosting {
  const requiredFields = [
    "posting_id",
    "source",
    "company_name",
    "canonical_url",
    "title",
    "first_seen_at",
    "last_updated",
  ] as const;

  for (const field of requiredFields) {
    if (!row[field]) {
      throw new Error(`Job CSV row is missing required field: ${field}`);
    }
  }

  return {
    posting_id: row.posting_id,
    source: row.source,
    company_name: row.company_name,
    canonical_url: row.canonical_url,
    title: row.title,
    project: row.project || null,
    location: row.location || null,
    employment_type: row.employment_type || null,
    remote_type: row.remote_type || null,
    writer_match_confidence: parseNumber(row.writer_match_confidence),
    first_seen_at: parseDate(row.first_seen_at, "first_seen_at"),
    last_updated: parseDate(row.last_updated, "last_updated"),
    description: parseDescription(row.description),
  };
}

function parseDescription(value: string): JobDescription {
  if (!value) return {};

  try {
    return JSON.parse(value) as JobDescription;
  } catch {
    throw new Error(
      "A job CSV row contains invalid JSON in its description column."
    );
  }
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Job CSV row has an invalid ${field}: ${value}`);
  }
  return date;
}

function parseNumber(value: string): number | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseBoolean(value: string): boolean {
  return ["true", "t", "1", "yes"].includes(value.trim().toLowerCase());
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

  const [headers, ...rows] = records;
  if (!headers) return [];

  return rows.map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Job CSV row ${rowIndex + 2} has ${values.length} columns; expected ${headers.length}.`
      );
    }

    return Object.fromEntries(
      headers.map((header, index) => [header.trim(), values[index]])
    );
  });
}

export function getJobSummary(job: JobPosting): string {
  const summary =
    job.description.responsibilities || job.description.qualifications || "";

  return summary.replace(/\s+/g, " ").trim();
}

export function getExperienceLabel(job: JobPosting): string | null {
  const years = job.description.technical_details?.minimum_years;
  return years ? `${years}+ years` : null;
}

const COUNTRY_MARKERS: Array<[string, string[]]> = [
  ["Belgium", ["belgium", "gent"]],
  ["Canada", ["canada", "montreal", "montréal", "quebec", "québec"]],
  ["China", ["china", "beijing"]],
  ["Finland", ["finland", "helsinki"]],
  ["France", ["france", "paris"]],
  ["Germany", ["germany", "munich"]],
  ["Poland", ["poland", "warsaw"]],
  ["Spain", ["spain", "barcelona"]],
  ["Sweden", ["sweden", "stockholm", "malmö", "malmo"]],
  [
    "United Kingdom",
    [
      "united kingdom",
      " uk",
      "uk ",
      "brighton",
      "guildford",
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

export function getJobCountries(job: JobPosting): string[] {
  const location = job.location?.trim();
  if (!location) return ["Unspecified"];

  const normalized = ` ${location.toLowerCase().replace(/\s+/g, " ")} `;
  if (normalized.includes("remote (europe)")) return ["Europe"];
  if (normalized.trim() === "any") return ["Worldwide"];

  const countries = COUNTRY_MARKERS.filter(([, markers]) =>
    markers.some(marker => normalized.includes(marker))
  ).map(([country]) => country);

  return countries.length > 0 ? countries : ["Unspecified"];
}

const SOURCE_LABELS: Record<string, string> = {
  "igda writing sig": "IGDA Writing SIG",
  activision: "Activision",
  cdprojektred: "CD PROJEKT RED",
  gracklehq: "Grackle",
  hitmarker: "Hitmarker",
  larianstudios: "Larian Studios",
  obsidian: "Obsidian Entertainment",
  wizardsofthecoast: "Wizards of the Coast",
};

export function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source.trim().toLowerCase()] || source;
}
