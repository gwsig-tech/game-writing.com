# Jobs `location` data — parsing contract and upstream cleanup requests

**Audience:** the services that generate the job-postings Google Sheet and CSV (crawler → cleaning → review stages).
**Status:** definitive as of 2026-07-05, matching the classifier in `src/lib/jobs.ts` (`getJobCountries` / `normalizeLocation`).
**Companion doc:** `src/data/jobs/README.md` (the overall column schema); this doc covers only the `location` column.

The site displays `location` verbatim on each job card and also derives the **country filter** from it. Because `location` arrives as free text scraped from many job boards, the site currently runs a defensive normalize-and-match pass over it at build time. This document specifies exactly what that pass does, catalogs the inconsistencies we see in real data, and states what we would like the upstream cleaning/review stage to take over so the data is canonical at the source rather than repaired at render.

## 1. How the site parses `location` today

The site never splits the string on delimiters. It normalizes the entire value and then matches a curated marker table on whole words; **every** marker the string mentions contributes its country, which is how multi-location rows end up under each of their countries.

Normalization steps, in order:

1. Trim. An empty/missing value classifies as **Unspecified** (a real filter bucket, not an error).
2. Unicode NFD-decompose and strip combining marks, folding accents to ASCII (`Montréal` → `montreal`, `Malmö` → `malmo`). Letters with no ASCII decomposition (e.g. Polish `ł`) are **not** folded — they become word breaks in step 4, so `Wrocław` alone is unmatchable and relies on a `Poland` token being present.
3. Lowercase.
4. Replace every run of characters outside `a-z0-9` with a single space. This collapses all separators and punctuation — commas, pipes (`|`), semicolons, slashes, parentheses, hyphens — so `"Warsaw, Poland | Malmö, Sweden"` becomes `warsaw poland malmo sweden`.
5. Rewrite the phrase `new mexico` to `united states` (the US state would otherwise be claimed by the `mexico` marker).
6. Pad with spaces and test each marker as a whole word (` marker `). Whole-word matching is what keeps `india` from firing inside `Indiana`, `uk` inside `Ukraine`, and `any` inside `Germany`.
7. Every matching marker adds its country/region to the result; a row matching nothing classifies as **Unspecified**.

Properties that fall out of this design — and that upstream can rely on:

- **Separator-agnostic:** `|`, `;`, and `/` all work identically, with or without surrounding spaces.
- **Order-agnostic:** `"City, Country"`, `"Country, City"`, and `"City, Country, Region"` all classify the same.
- **Case- and accent-insensitive** (per step 2's `ł`-style caveat).
- **Additive:** a multi-location row appears under every country it names; the filter matches a job if *any* selected country applies.

### The marker table (snapshot)

Filter labels are exactly these names. City markers exist only for cities that have appeared upstream *without* a country; a `City, Country` row already matches via the country token.

| Filter label | Markers |
| --- | --- |
| Armenia | armenia, yerevan |
| Belarus | belarus, minsk |
| Belgium | belgium, gent |
| Canada | canada, montreal, quebec, toronto, vancouver |
| China | china, beijing, guangzhou |
| Cyprus | cyprus, limassol |
| Denmark | denmark, copenhagen |
| Finland | finland, helsinki |
| France | france, paris, bordeaux |
| Georgia | tbilisi, tblisi (the bare word "georgia" is deliberately **not** a marker — US state collision) |
| Germany | germany, munich, berlin, giebelstadt |
| India | india |
| Indonesia | indonesia, jakarta |
| Japan | japan, tokyo |
| Mexico | mexico (safe only because "new mexico" is rewritten first) |
| Poland | poland, warsaw, warszawa, bielsko |
| Romania | romania, bucharest |
| Serbia | serbia, belgrade |
| South Korea | south korea, seoul |
| Spain | spain, barcelona |
| Sweden | sweden, stockholm, malmo |
| Ukraine | ukraine, kyiv, kiev |
| United Kingdom | united kingdom, uk, england, brighton, guildford, manchester, nottingham, oxford, warwick |
| United States | united states, usa, boston ma, california, cincinnati, irvine ca, los angeles, new york city, ohio, san carlos, santa monica |
| Vietnam | vietnam, ho chi minh |
| Europe *(region)* | europe |
| North America *(region)* | north america |
| South America *(region)* | south america |
| Worldwide *(region)* | worldwide, any |
| Unspecified | *(fallback — empty or unmatched)* |

## 2. What we observe in the current data

Every category below is drawn from real rows in the 2026-07-04 snapshot:

- **Three different multi-location separators:** `"Warsaw, Poland | Malmö, Sweden"` (pipe), `"Barcelona; Helsinki Metropolitan Area"` (semicolon), `"USA / Canada"` and `"North America / Canada / Europe"` (slash).
- **Country naming variance:** `USA` / `United States` / `United States of America`; `UK` / `United Kingdom`; `DK` for Denmark.
- **Segment-order variance:** `"Cyprus, Limassol"` (country first), `"Brighton, United Kingdom, England"` and `"Madison, United States of America, Wisconsin"` (country before region), `"Canada, Montreal, QC"`.
- **Bare cities with no country:** Barcelona, Bordeaux, Gent, Guildford, Jakarta, Minsk, Montreal, Paris, Santa Monica, Seoul, Toronto, Warsaw. Each of these costs a hand-curated marker on our side, and ambiguous ones (a bare `London` could be UK or Ontario; a bare `Cambridge` could be UK or Massachusetts; a bare `Vancouver` could be BC or Washington state) can never be classified reliably.
- **Spelling/accent variants of the same place:** `Montreal` / `Montréal` / `Montreal, Quebec` / `Montréal, QC, Canada`; `Warsaw, Masovian Voivodeship` / `Warsaw, Mazowieckie`.
- **Typos:** `Tblisi` (for Tbilisi — we carry the typo as a marker).
- **Placeholder junk:** `2 Locations`, `Multiple Locations`, `Unlisted`, `Los Angeles Office`. The first three convey nothing and land in Unspecified.
- **Region-only values:** `Europe`, `Eastern Europe (selected countries)`, `Worldwide`, `Worldwide (-/+ 2h from GMT+1)`, `Any`, `South America / Worldwide`.
- **Remoteness leaking into location:** `Remote (Europe)` — remoteness belongs in the `remote_type` column, which already exists.

## 3. What we'd like the cleaning/review stage to own

In priority order. Items 1–3 remove entire failure classes; the rest are polish.

1. **One canonical separator for multiple locations: `" | "`** (pipe with a space on each side). Replace `;` and `/` lists. The site handles all three today, but a single canonical form makes the review stage's own diffing and deduping saner, and slash is genuinely ambiguous (`"North America / Canada / Europe"` — alternatives? union? hierarchy?).
2. **Every location segment must end with a canonical country name — or be a canonical region.** Format per segment: `City, Country` or `City, Region/State, Country`. This is the single highest-value change: it eliminates the bare-city problem, which is the only part of classification that requires ongoing hand-curation (and a site deploy) on our side. If the crawler knows only a city, the cleaning stage should resolve the country before the row reaches the sheet.
3. **Canonical country names**, exactly as the site's filter labels them (see the table in §1): `United States` (not USA / United States of America), `United Kingdom` (not UK / England as the country field), `South Korea`, etc. English conventional short names.
4. **Canonical region vocabulary** for roles genuinely broader than one country: `Worldwide`, `Europe`, `North America`, `South America`. Use these instead of `Any`, `Eastern Europe (selected countries)`, `Worldwide (-/+ 2h from GMT+1)` — put timezone or eligibility constraints in `summary`. Extending the vocabulary is fine; just tell us so the filter grows with it.
5. **Keep remoteness out of `location`.** `Remote (Europe)` should be `location: Europe` + `remote_type: remote`.
6. **No placeholders.** Resolve `2 Locations` / `Multiple Locations` into the actual list, or leave the field **blank** — blank cleanly classifies as Unspecified, whereas a placeholder is noise on the card. `Los Angeles Office` should be `Los Angeles, United States`.
7. **Stable spellings and fixed typos:** one spelling per place (`Montreal, Quebec, Canada`; `Tbilisi`). Accents are fine (the site folds them) — consistency matters more than which form you pick.

### The end state: a structured country column

The cleanest long-term contract is for the sheet to carry the classification explicitly, e.g. a `countries` column alongside the human-readable `location`: pipe-separated **ISO 3166-1 alpha-2 codes** (`PL | SE`), with the small region vocabulary from §3.4 for broader-than-country rows. Codes beat names here — they're unambiguous, every geocoder emits them, and the site can render user-facing labels from them with zero new data (see §4). The site would consume the column directly and keep the marker classifier only as a fallback for rows where it's blank. Unknown extra columns are already ignored by the site's header-based parser, so upstream can start populating this any time — say the word and we'll wire it up.

## 4. Standards to build on (don't reinvent)

This is a well-trodden problem; each layer of it has an established standard or dataset the cleaning stage can adopt instead of hand-rolling:

- **Country identity: ISO 3166-1 alpha-2 codes** (`US`, `GB`, `PL`). The universal join key — every geocoder, gazetteer, and i18n library speaks it. Store codes, not names.
- **Display names: Unicode CLDR.** Node and browsers expose CLDR's English common names natively via `Intl.DisplayNames(["en"], { type: "region" })` — `KR` → "South Korea", `GB` → "United Kingdom" — so nobody needs to maintain a name list at all. (Python equivalents: `pycountry`, `country_converter`, which also parse the many aliases like "United States of America" back to a code.)
- **City → country resolution: GeoNames** (geonames.org, CC-BY). The standard open gazetteer; its `cities500` extract (~200k cities with country codes and alternate/accented spellings) is a small offline lookup that resolves every bare city in §2 — including telling you when a name is ambiguous (London, Cambridge, Vancouver) and needs review.
- **Or geocode instead of looking up:** OSM **Nominatim** (free, 1 req/s + attribution), Google Geocoding/Places, or OpenCage all take messy free text and return structured country codes. Postings trickle in slowly, so one cached geocode per new posting costs effectively nothing.
- **Parsing full street addresses: libpostal** — the ML address parser trained on OpenStreetMap/OpenAddresses. Only worth it if real street addresses start appearing; city/country strings don't need it.
- **Best option — skip parsing entirely: schema.org `JobPosting` JSON-LD.** Most ATS-hosted job pages (Greenhouse, Lever, Workable…) embed structured `jobLocation` → `address` → `addressCountry` (frequently already an ISO code) specifically so Google Jobs can index them. Wherever the crawler's source page has this, harvest it instead of scraping display text — the free-text `location` then becomes purely cosmetic and the whole normalization problem disappears at the root.
- **Regions:** UN M49 codes exist (World `001`, Europe `150`, South America `005`) but are heavier than we need; the small agreed vocabulary in §3.4 is fine. There is **no** standard for remote/eligibility semantics — which is exactly why it belongs in `remote_type`/`summary`, not in `location`.

Why the site doesn't just use these itself: the build is static, the row count is tiny, and the render path must never fail or grow network dependencies — at that scale a curated marker table is the right tool. The standards belong upstream in the cleaning stage, which is the same division of labor §3 asks for.

## 5. What the site keeps doing regardless

Defense in depth stays, because the sheet is human-edited and the build runs unattended: trimming, accent folding, punctuation/separator collapsing, whole-word marker matching, and the Unspecified fallback. A malformed location can therefore never fail a build or hide a posting — worst case it files under Unspecified. But note the card renders `location` **verbatim**, so upstream text quality is directly user-visible no matter how well classification copes.

## 6. Appendix — shared normalization algorithm (pseudocode)

For the cleaning stage to reuse (e.g. to validate country names or pre-compute the structured column):

```
normalize(location):
  s = trim(location)
  s = NFD(s) with combining marks removed      # Montréal → Montreal
  s = lowercase(s)
  s = replace runs of [^a-z0-9] with " "        # all punctuation/separators → word breaks
  s = replace word-phrase "new mexico" → "united states"
  return " " + trim(s) + " "

classify(location):
  if normalize input empty: return {Unspecified}
  n = normalize(location)
  result = { label for (label, markers) in MARKER_TABLE
             if any (" " + marker + " ") substring-of n }
  return result if non-empty else {Unspecified}
```

`MARKER_TABLE` is the table in §1; markers are stored pre-normalized (lowercase ASCII, single spaces). The classifier's source of truth is `getJobCountries` in `src/lib/jobs.ts`.
