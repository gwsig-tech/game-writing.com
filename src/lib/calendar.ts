import { google } from "googleapis";

/**
 * Build-time reader for a **public** Google Calendar.
 *
 * The sibling of `src/lib/sheets.ts`: it uses a Google Cloud **API key**
 * (`GOOGLE_CALENDAR_API_KEY`), which can only read calendars that are already
 * public. An API key cannot read private calendars or write to any calendar —
 * that requires a service account or OAuth.
 *
 * Usage from an `.astro` page (env is read in the page):
 *
 *   import { getUpcomingEvents } from "@/lib/calendar";
 *   const { events, error } = await getUpcomingEvents({
 *     apiKey: import.meta.env.GOOGLE_CALENDAR_API_KEY,
 *     calendarId: "someone@gmail.com",
 *   });
 */
export type CalendarEvent = {
  summary?: string;
  location?: string;
  htmlLink?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
};

export type CalendarEventsResult = {
  /** Upcoming events ordered by start time; empty when unconfigured or on error. */
  events: CalendarEvent[];
  /** Human-readable reason the fetch was skipped or failed, else null. */
  error: string | null;
};

export type GetUpcomingEventsOptions = {
  /** `GOOGLE_CALENDAR_API_KEY`. When falsy the fetch is skipped gracefully. */
  apiKey: string | undefined;
  /** The calendar ID (for Google-account calendars, the account email). */
  calendarId: string;
};

/**
 * Fetches the next year of events from a public calendar, degrading
 * gracefully like the rest of our build-time integrations: an unset key or a
 * failed request returns an empty result with an `error` message instead of
 * throwing and failing the build.
 */
export async function getUpcomingEvents({
  apiKey,
  calendarId,
}: GetUpcomingEventsOptions): Promise<CalendarEventsResult> {
  if (!apiKey) {
    return { events: [], error: "Calendar API key not configured." };
  }

  try {
    const calendar = google.calendar({ version: "v3", auth: apiKey });
    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });
    return {
      events: (response.data.items as CalendarEvent[]) || [],
      error: null,
    };
  } catch (e) {
    console.error("Failed to fetch calendar events:", e);
    return { events: [], error: "Unable to load calendar events." };
  }
}

export function formatEventDate(event: CalendarEvent): string {
  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;
  if (!start) return "TBD";

  const startDate = new Date(start);
  const isAllDay = !event.start?.dateTime;

  // Use the event's timezone, or fall back to America/New_York
  const eventTimeZone = event.start?.timeZone || "America/New_York";

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: eventTimeZone,
  };

  const timeOnlyOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: eventTimeZone,
  };

  // For all-day events, check if it spans multiple days
  if (isAllDay && end) {
    // All-day event end dates are exclusive (next day), so subtract 1 day
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() - 1);

    // Check if start and end are different days
    const startStr = startDate.toLocaleDateString("en-US", dateOptions);
    const endStr = endDate.toLocaleDateString("en-US", dateOptions);

    if (startStr !== endStr) {
      return `${startStr} - ${endStr}`;
    }
  }

  // Single day all-day event
  if (isAllDay) {
    return startDate.toLocaleDateString("en-US", dateOptions);
  }

  // Timed event - show date on line 1, time range on line 2
  const dateStr = startDate.toLocaleDateString("en-US", dateOptions);
  const startTimeStr = startDate.toLocaleTimeString("en-US", timeOnlyOptions);

  if (end && event.end?.dateTime) {
    const endDate = new Date(end);
    const endTimeStr = endDate.toLocaleTimeString("en-US", timeOnlyOptions);
    return `${dateStr}\n${startTimeStr} - ${endTimeStr}`;
  }

  return `${dateStr}\n${startTimeStr}`;
}
