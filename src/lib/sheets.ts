import { google } from "googleapis";

/**
 * Build-time reader for a **public** Google Sheet.
 *
 * The sibling of `src/lib/calendar.ts`: it uses a
 * Google Cloud **API key** (`GOOGLE_SHEETS_API_KEY`), which can only read data
 * that is already public. The target spreadsheet must be shared as
 * "Anyone with the link → Viewer". An API key cannot read private sheets or
 * write to any sheet — that requires a service account or OAuth.
 *
 * Enable the "Google Sheets API" in the same Google Cloud project as the
 * calendar key (APIs & Services → Library), then create/restrict a key under
 * APIs & Services → Credentials.
 *
 * Usage from an `.astro` page (env is read in the page):
 *
 *   import { getPublicSheetValues } from "@/lib/sheets";
 *   const { rows, error } = await getPublicSheetValues({
 *     apiKey: import.meta.env.GOOGLE_SHEETS_API_KEY,
 *     spreadsheetId: "1AbC...the-id-from-the-sheet-url",
 *     range: "Sheet1!A1:D",
 *   });
 */
export type SheetValuesResult = {
  /** Rows of cell strings; empty when unconfigured or on error. */
  rows: string[][];
  /** Human-readable reason the fetch was skipped or failed, else null. */
  error: string | null;
};

export type GetPublicSheetValuesOptions = {
  /** `GOOGLE_SHEETS_API_KEY`. When falsy the fetch is skipped gracefully. */
  apiKey: string | undefined;
  /** The spreadsheet ID (the long token in the sheet's URL). */
  spreadsheetId: string;
  /** An A1 range, e.g. `"Sheet1!A1:D"`. */
  range: string;
};

/**
 * Fetches values from a public sheet, degrading gracefully like the rest of
 * our build-time integrations: an unset key or a failed request returns an
 * empty result with an `error` message instead of throwing and failing the
 * build.
 */
export async function getPublicSheetValues({
  apiKey,
  spreadsheetId,
  range,
}: GetPublicSheetValuesOptions): Promise<SheetValuesResult> {
  if (!apiKey) {
    return { rows: [], error: "Sheets API key not configured." };
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: apiKey });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return { rows: (response.data.values as string[][]) ?? [], error: null };
  } catch (e) {
    console.error("Failed to fetch sheet values:", e);
    return { rows: [], error: "Unable to load sheet data." };
  }
}
