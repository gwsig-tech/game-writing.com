# Jobs Feature — Completion Plan

**Status:** in progress, ~70% complete
**Original author:** Shen (commits a754d61..396538f, 2026-04-05)
**Plan author:** Jon, 2026-04-26
**Branch:** `jobs-tab`

## Goal

Ship a `/jobs` page backed by an Astro content collection, fed by two parallel input methods:

1. **Manual** — a contributor drops a markdown file with job frontmatter into the collection
2. **Automated** — a contributor pastes a LinkedIn URL into a tracked text file; a GitHub Action scrapes OpenGraph tags into a markdown file in the collection and commits back

Both paths produce the same content shape (a `jobs` collection entry), so the listing and detail pages don't care which produced an entry.

## What's already done

- Desktop and mobile nav links to `/jobs` ([src/components/Header.astro](../../src/components/Header.astro))
- [src/components/JobCard.astro](../../src/components/JobCard.astro) — listing card component, complete
- [src/pages/jobs/[...slug].astro](../../src/pages/jobs/[...slug].astro) — detail-page template, layout is good
- [scripts/process_job_postings.py](../../scripts/process_job_postings.py) — LinkedIn OG-tag scraper with slugified filenames + duplicate-skip
- [.github/workflows/process-job-postings.yml](../../.github/workflows/process-job-postings.yml) — path-triggered Action that runs the scraper, commits results, blanks the input file
- A correct schema for jobs (just in the wrong file — see below)
- A hand-written sample job ([src/content/creative-writer-blocky-studios.md](../../src/content/creative-writer-blocky-studios.md))

## What's broken or missing

### 1. The `jobs` collection is never registered

**Why:** Schema lives in [src/content/config.ts](../../src/content/config.ts), which is the **Astro v4** content-config path. This project runs Astro v5, which reads [src/content.config.ts](../../src/content.config.ts). The legacy file is silently ignored — `getCollection("jobs")` always returns `[]`.

There's a second hazard: the legacy file also redefines `blog` as `defineCollection({ /* your existing blog code is here */ })` — a placeholder that would clobber the real blog collection if Astro ever loaded it.

**Fix:** Add the `jobs` collection to [src/content.config.ts](../../src/content.config.ts) using the v5 glob loader, then delete [src/content/config.ts](../../src/content/config.ts) entirely.

```ts
// in src/content.config.ts
const jobs = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/data/jobs" }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    category: z.string(),
    workType: z.string(),
    experience: z.string(),
    datePosted: z.string(),
    applyLink: z.string().url(),
    description: z.string(),
  }),
});

export const collections = { blog, jobs };
```

### 2. Content lives in inconsistent locations

Right now job markdown sits at `src/content/*.md` (root of `src/content/`), and the scraper writes to `src/content/jobs/`. Neither matches the pattern the blog uses (`src/data/blog/`).

**Fix:** Standardize on `src/data/jobs/` to match the blog convention. Then:

- Move [src/content/creative-writer-blocky-studios.md](../../src/content/creative-writer-blocky-studios.md) → `src/data/jobs/`
- Delete the empty [src/content/principal-ux-writer.md](../../src/content/principal-ux-writer.md)
- Update the Python scraper's `OUTPUT_DIR` and `INPUT_FILE`:
  - `INPUT_FILE` → `src/data/jobs/_raw_postings.txt` (underscore-prefixed so the glob loader's `[^_]*` pattern excludes it from the collection)
  - `OUTPUT_DIR` → `src/data/jobs/`
- Update the workflow's `paths:` trigger and the `git add` paths to match
- Move [src/content/raw_job_postings.txt](../../src/content/raw_job_postings.txt) → `src/data/jobs/_raw_postings.txt` (and clear it before merge — the LinkedIn URL there was a test artifact)

### 3. Route collision on `/jobs`

[src/pages/jobs.astro](../../src/pages/jobs.astro) and [src/pages/jobs/index.astro](../../src/pages/jobs/index.astro) both define the `/jobs` route. The `index.astro` file is empty and was likely created by accident in commit `3f2ca59`.

**Fix:** Delete [src/pages/jobs/index.astro](../../src/pages/jobs/index.astro).

### 4. `jobs.astro` doesn't read from the collection

The page hardcodes a single `JobCard` whose link points to `principal-ux-writer-riftbound`, which has no matching content file. This is the immediate cause of the 404.

**Fix:** Rewrite [src/pages/jobs.astro](../../src/pages/jobs.astro) to load entries via `getCollection("jobs")` and render a `JobCard` per entry. Sort by `datePosted` desc. Pass `entry.id` (the v5 slug) to JobCard.

```astro
---
import { getCollection } from "astro:content";
import Layout from "../layouts/Layout.astro";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import JobCard from "../components/JobCard.astro";

const jobs = (await getCollection("jobs")).sort(
  (a, b) => new Date(b.data.datePosted).valueOf() - new Date(a.data.datePosted).valueOf()
);
---

<Layout title="Jobs | IGDA Game Writing SIG">
  <Header />
  <main class="mx-auto max-w-app px-4 py-12">
    <header class="mb-12 border-b border-border pb-8">
      <h1 class="text-4xl font-bold text-slate-900">Open Roles</h1>
      <p class="mt-2 text-lg text-slate-600">Opportunities within the narrative and game writing space.</p>
    </header>

    <ul class="space-y-2">
      {jobs.map((job) => (
        <JobCard
          id={job.id}
          title={job.data.title}
          company={job.data.company}
          location={job.data.location}
          category={job.data.category}
          workType={job.data.workType}
          experience={job.data.experience}
          description={job.data.description}
          date={job.data.datePosted}
        />
      ))}
    </ul>
  </main>
  <Footer />
</Layout>
```

### 5. `[...slug].astro` uses Astro v4 API

[src/pages/jobs/[...slug].astro](../../src/pages/jobs/[...slug].astro) calls `entry.slug` and `await entry.render()`, which were removed in Astro v5 when using the glob loader.

**Fix:** Use `entry.id` for the slug param and `render(entry)` from `astro:content`:

```ts
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const jobEntries = await getCollection("jobs");
  return jobEntries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
// ...
```

Also drop the `as any` casts that were added as a workaround when the collection wasn't registering.

### 6. Sample content needs to match the new conventions

After moves, `src/data/jobs/` should contain at least one well-formed sample job so the page isn't empty on first deploy. Re-create `principal-ux-writer-riftbound.md` (the slug the original sample card linked to) with proper frontmatter and a real body, OR just rely on the existing `creative-writer-blocky-studios.md` after moving it. Pick one and delete the leftovers.

## Open questions / decisions

1. **Mobile nav lost Archives.** Commit `9695b35` replaced the mobile-only Archives link with Jobs. Was that intentional, or should both fit? If both, the mobile grid layout needs adjusting.
2. **`JOBS` config in [src/config.ts](../../src/config.ts)** exports `itemsPerPage` and `showDate` but nothing reads them. Either wire pagination (the blog uses it) and a date toggle into the listing page, or remove the unused export.
3. **LinkedIn scraping reliability.** The scraper uses a Googlebot User-Agent ([scripts/process_job_postings.py:20](../../scripts/process_job_postings.py#L20)) which LinkedIn may or may not honor depending on the URL. Worth doing one full end-to-end test (paste URL, push, watch the Action, verify the resulting markdown) before relying on the automation. If LinkedIn blocks it, fallback options: a different UA, a paid scraping API, or just accept that LinkedIn URLs will fail and document that the workflow only handles publicly-cacheable job pages.
4. **Workflow scope.** The Action triggers on push to *any* branch when `raw_job_postings.txt` changes. Since Sveltia commits to `draft`, that's likely the intended path. If it should only run on `draft`, add a `branches: [draft]` filter.
5. **Categories.** Schema has `category: z.string()` (free-form). Worth tightening to a `z.enum([...])` once the editorial team decides on the taxonomy (Design, Narrative, UX, Production, etc.).

## Recommended commit sequence

Each step is independently buildable, so it's easy to bisect if something regresses.

1. Register the `jobs` collection in [src/content.config.ts](../../src/content.config.ts); delete [src/content/config.ts](../../src/content/config.ts)
2. Move job content + raw input file under `src/data/jobs/`; update scraper + workflow paths; delete empty `principal-ux-writer.md`
3. Delete empty [src/pages/jobs/index.astro](../../src/pages/jobs/index.astro)
4. Rewrite [src/pages/jobs.astro](../../src/pages/jobs.astro) to read from the collection
5. Update [src/pages/jobs/[...slug].astro](../../src/pages/jobs/[...slug].astro) to v5 API
6. (Optional) Wire or remove the unused `JOBS` config export
7. (Optional) Decide mobile nav: keep both Archives and Jobs, or accept the swap

## Test checklist

- [ ] `pnpm dev` starts with no router collision warnings
- [ ] `/jobs` lists at least one job card
- [ ] Clicking a card navigates to `/jobs/<slug>` and renders the body markdown
- [ ] `pnpm build` completes (this exercises Pagefind indexing too)
- [ ] Manual flow: add a new MD file under `src/data/jobs/`, commit, see it appear
- [ ] Automated flow end-to-end: paste a LinkedIn URL into `_raw_postings.txt` on a test branch, push, verify the Action runs, scrapes, commits the MD, and blanks the input file
- [ ] Mobile nav still works after the layout changes
- [ ] Existing blog posts still render (sanity-check the legacy `src/content/config.ts` removal didn't break anything)

## Reference: original commit chronology

| # | Commit | What |
|---|---|---|
| 1 | `a754d61` | Desktop nav: added "Jobs" link |
| 2 | `9695b35` | Mobile nav: added "Jobs" link, dropped Archives |
| 3 | `1069492` | First `jobs.astro` (basic) |
| 4 | `a242da8` | Hardcoded sample job |
| 5 | `3f2ca59` | Layout update; created empty `jobs/index.astro` (collision source) |
| 6 | `c5d3cdb` | Big restructure: JobCard component, `[...slug].astro`, schema (in wrong file), `JOBS` config export |
| 7 | `547dc09` | Added Action + Python scraper + empty input file |
| 8 | `2a8c989` | Reworked scraper, added test LinkedIn URL |
| 9 | `8bd2068` | Simplified scraper |
| 10| `396538f` | Added hand-written sample (`creative-writer-blocky-studios.md`) |
