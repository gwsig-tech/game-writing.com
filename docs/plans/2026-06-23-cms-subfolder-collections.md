# CMS Subfolder Collections & Image Foldering — June 2026

**Date:** 2026-06-23
**Branch:** `draft` (plan only — no execution yet)
**Author:** Jon
**Status:** Planned, intentionally deferred. Do lower-risk updates first; this
touches published blog prose, so we want it sequenced after other work.

## Summary

Sveltia CMS only surfaces blog posts and images that live at the *top level* of
their configured folders. Real, published content sitting in subfolders
(`src/data/blog/_events`, `src/data/blog/_spotlights`) and images in
`src/assets/images/*` subfolders are invisible/uneditable in the CMS UI.

The fix is two parts:

1. **Blog** — add one CMS collection per content subfolder (Events, Spotlights).
   This requires standardizing each folder on a single file extension (`.mdx`),
   because Sveltia allows only one extension per collection — which in turn
   requires small content fixes to a few posts.
2. **Images** — use Sveltia **asset collections** (added in v0.167.0) to expose the
   existing `src/assets/images/*` subfolders as browsable, reusable buckets in the
   Asset Library / image picker, optionally backed by per-collection upload
   defaults — all while keeping the Astro `@`-alias reference scheme that body
   images depend on.

We are **not executing yet** — see [Sequencing](#sequencing--why-deferred).

## Sveltia version & feature check (reviewed 2026-06-23)

We load Sveltia **unpinned** from the CDN
(`https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js` in
[public/admin/index.html](../../public/admin/index.html)), so the CMS always runs
the latest published release at page-load time — currently **v0.167.3**
(2026-06-18). Findings from the release notes that bear on this plan:

- **Asset collections (v0.167.0, 2026-06-13) — NEW.** Define named, browsable asset
  folders (top-level `asset_collections`) shown in the Asset Library and the image
  picker, reusable across all content collections. This is the officially supported
  answer to "images in subfolders aren't accessible," and it supersedes the
  per-collection-`media_folder`-only workaround. See revised [Phase B](#phase-b--images-asset-collections-primary--per-collection-upload-defaults).
- **No recursive/nested entry listing.** Subfolder *storage* via the `path` option
  now exists, but Sveltia still has no Decap-style nested-collection *listing* — a
  collection lists only files directly in its `folder`. So the blog analysis stands:
  subfolder posts still need their own collections (Phase A).
- **Still one file extension per folder collection.** No multi-extension support
  was added (the v0.166.0 `html.md` fix only relaxed a specific extension/format
  mismatch). So the `.mdx` normalization in Phase A is still required.

Because we're unpinned, treat the CMS as a moving target: re-check the
[releases page](https://github.com/sveltia/sveltia-cms/releases) before executing,
and consider pinning a version if a release ever regresses our workflow.

## Background — the problem

Sveltia/Decap **folder collections are flat**: a collection with
`folder: src/data/blog` lists only files directly in that directory. Astro's
content loader, by contrast, globs `**/[^_]*.{md,mdx}` and *does* descend into
subfolders, and [getPath.ts](../../src/utils/getPath.ts) strips `_`-prefixed
directory segments from the URL. So subfolder posts are **published at flat
`/posts/<slug>` URLs but cannot be edited through the CMS.**

What's actually in those subfolders (checked 2026-06-23):

| Folder | Posts | Status |
|---|---|---|
| `_events/` | 3 | **All published & live** |
| `_spotlights/` | 6 | **All published & live** |
| `_releases/` | 4 | `draft: true` — AstroPaper theme samples, hidden |
| `examples/` | 10 | `draft: true` — AstroPaper theme samples, hidden |

So **9 live posts are uneditable today.** `_releases` and `examples` are theme
demo drafts and out of scope here (candidates for deletion in separate cleanup).

## Key mechanics to preserve

### `media_folder` vs `public_folder` (the two-folder system)

These point at the **same physical directory via two addressing schemes** and
must always be configured as a pair:

```yaml
media_folder: src/assets/      # WHERE the file is committed — a real repo path
public_folder: "@/assets/"     # WHAT prefix is written into content — the Astro
                               # `@` import alias (@/* -> ./src/*, see tsconfig.json)
```

`public_folder` here is **not a web URL** — it's the Astro import alias. Body
images written as `![alt](@/assets/images/events/foo.jpg)` get pulled into
**Astro's image-optimization pipeline** (hash/resize/WebP) at build. If
`public_folder` were a plain web path (`/assets/...`), images would 404 (they
live in `src/`, not `public/`) or skip optimization.

Two consequences:

- **The alias is depth-independent.** `@/assets/...` resolves identically whether
  a post is at the top level or in a subfolder — so body images already work
  regardless of post nesting. The only thing broken is *where new uploads land*
  and *folder browsing*, not reference resolution.
- **`ogImage` is the exception and is fragile.** Frontmatter `ogImage` uses a
  *relative* path whose depth tracks the folder (`../../assets/...` at top level,
  `../../../assets/...` one level deep), because `image()` in
  [content.config.ts](../../src/content.config.ts) resolves relative to the file
  and does **not** honor the `@` alias. The CMS does not currently expose an
  `ogImage` field (editors hand-author it), so it's out of scope — but see
  [Open questions](#open-questions--future-work) before adding one.

Verified rule (Sveltia docs): a **collection-level** `media_folder` must start
with `/` to mean repo-root-relative. Without a leading slash, Sveltia stores
media *next to each entry file*. `public_folder` is written literally as the
reference prefix.

### One extension per collection → the MDX requirement

Sveltia allows **exactly one file extension per folder collection** (no
multi-extension syntax). A collection set to `mdx` will not list `.md` files,
and vice-versa.

Both target folders are mixed, and the mix **cannot be reconciled without
editing content**, because the `.mdx` files genuinely need MDX features and
cannot be downgraded to `.md`:

| Folder | `.md` files | `.mdx` files (require MDX) |
|---|---|---|
| `_events` | `2025-11-17-game-your-future.md` (MDX-safe) | `2026-02-25-sig-at-gdc.mdx`, `2026-06-22-write-club-recap.mdx` — use `<iframe>` / `<div>` |
| `_spotlights` | 5 judge spotlights (use `<https://…>` autolinks) | `2026-01-14-protecting-yourself-making-sad-game.mdx` — uses `<u>` + `<GameEmbed/>` |

**Only consistent direction: standardize both folders on `.mdx`.** That requires
the content fixes below so the `.md` files parse cleanly as MDX.

## The plan

### Phase A — Blog: normalize extensions, then add collections

**A1. Rename 6 files `.md` → `.mdx`** (use `git mv` to preserve history; slugs
and URLs are unchanged — verified nothing references these filenames):

- `src/data/blog/_events/2025-11-17-game-your-future.md` (clean — no fixes needed)
- `src/data/blog/_spotlights/2025-11-15-bender-spotlight.md`
- `src/data/blog/_spotlights/2025-11-15-dejesus-spotlight.md`
- `src/data/blog/_spotlights/2025-11-15-dimopoulos-spotlight.md`
- `src/data/blog/_spotlights/2025-11-15-kershner-spotlight.md`
- `src/data/blog/_spotlights/2025-11-15-lassheikki-spotlight.md`

**A2. Fix MDX-unsafe syntax** (all on line ~16 of each spotlight). A bare
`<https://…>` autolink is interpreted as a JSX tag in MDX and breaks the build.
Unwrap the angle brackets:

- 4 spotlights (bender, dejesus, kershner, lassheikki):
  `[Name](<https://www.linkedin.com/in/…/>)` → `[Name](https://www.linkedin.com/in/…/)`
- `dimopoulos`: the original `[Konstantinos Dimopoulos]> (<https://…/>)` is
  **already a broken link on the live site** (stray `]>` + space). Fix to a
  proper link: `[Konstantinos Dimopoulos](https://www.linkedin.com/in/konstantinos-dimopoulos-42b62b4/)`

`<br/>` tags (kershner line 26) are valid self-closing MDX — leave as-is.

**A3. Add two collections** to [public/admin/config.yml](../../public/admin/config.yml),
mirroring the existing `posts` field set via a YAML anchor so the three never
drift. See the [config sketch](#config-sketch) below.

### Phase B — Images: asset collections (primary) + per-collection upload defaults

Sveltia **asset collections** (v0.167.0) are the right tool here: they expose
named, browsable folders in the Asset Library and image picker, reusable across
*all* content collections. This directly fixes the "images in subfolders aren't
accessible" complaint — editors can browse into Arcjam, Events, Spotlights, etc.,
and select or upload there.

Define one asset collection per existing image folder (top-level
`asset_collections` key). Each takes an absolute repo `media_folder` and a
`public_folder` — and crucially we keep `public_folder` as the **`@/assets/...`
alias** so inserted references still flow through Astro image optimization. (The
docs frame `public_folder` as a web URL, but Sveltia writes it literally, exactly
as our existing global `public_folder: "@/assets/"` already proves — see the
verification caveat below.)

| Asset collection | `media_folder` | `public_folder` |
|---|---|---|
| Images (root) | `/src/assets/images` | `@/assets/images` |
| Arcjam | `/src/assets/images/arcjam` | `@/assets/images/arcjam` |
| Events | `/src/assets/images/events` | `@/assets/images/events` |
| Spotlights | `/src/assets/images/spotlights` | `@/assets/images/spotlights` |
| Editor | `/src/assets/images/editor` | `@/assets/images/editor` |

Optionally, also set per-content-collection `media_folder`/`public_folder` (same
pairs) so a *new* Events/Spotlights post defaults its uploads into the matching
folder. Asset collections handle browsing/selection; the per-collection setting
just picks a sensible default upload target. The two are complementary.

- Keep the **global** `media_folder: src/assets/` / `public_folder: "@/assets/"`
  as the fallback / library root.
- Create `src/assets/images/spotlights/` (add a `.gitkeep`; the other folders
  already exist — `arcjam`, `events`, `editor`).
- ⚠️ **Verify on preview** that an asset collection with an `@/assets/...`
  `public_folder` writes the alias reference (not a coerced web path). The 2026-06-23
  docs review confirmed `public_folder` is officially expected to be a leading-slash
  web path — our `@/assets/...` alias is an accepted, out-of-spec deviation, and the
  maintainer's open issue #497 shows in-editor preview gaps for configured folders.
  This is **low-risk** because the literal-`public_folder`-write behavior is already
  load-bearing for our global `public_folder: "@/assets/"` and has been stable across
  continuous auto-updates. We **stay unpinned** (auto security fixes > freezing
  behavior); the preview check above is the safeguard, and we'd pin *reactively* only
  if an auto-update were ever observed to change the alias write. A bad write would
  also surface in PR review / build (a web-path ref 404s or skips optimization).

### Config sketch

```yaml
# Global = asset-library root + fallback. media_folder is the repo storage path;
# public_folder is the Astro `@` alias written into content (depth-independent,
# routes body images through Astro image optimization).
media_folder: src/assets/
public_folder: "@/assets/"

# Asset collections (Sveltia v0.167.0+): named, browsable image folders surfaced in
# the Asset Library + image picker, reusable across all content collections. Keep
# public_folder as the @/assets alias so inserted refs stay on the optimization path.
asset_collections:
  - name: images
    label: Images (root)
    icon: image
    media_folder: /src/assets/images
    public_folder: "@/assets/images"
  - name: arcjam
    label: Arcjam
    icon: trophy
    media_folder: /src/assets/images/arcjam
    public_folder: "@/assets/images/arcjam"
  - name: events
    label: Events
    icon: event
    media_folder: /src/assets/images/events
    public_folder: "@/assets/images/events"
  - name: spotlights
    label: Spotlights
    icon: star
    media_folder: /src/assets/images/spotlights
    public_folder: "@/assets/images/spotlights"
  - name: editor
    label: Editor
    icon: edit
    media_folder: /src/assets/images/editor
    public_folder: "@/assets/images/editor"

collections:
  - name: posts
    label: Blog Posts
    label_singular: Blog Post
    folder: src/data/blog
    extension: mdx
    create: true
    delete: false
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    media_folder: /src/assets/images
    public_folder: "@/assets/images"
    sortable_fields: [pubDatetime, title]
    fields: &postFields
      # ... existing field set (title, description, author, pubDatetime,
      # slug, featured, draft, tags, body) moves here unchanged ...

  - name: events
    label: Events
    label_singular: Event
    folder: src/data/blog/_events
    extension: mdx
    create: true
    delete: false
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    media_folder: /src/assets/images/events
    public_folder: "@/assets/images/events"
    sortable_fields: [pubDatetime, title]
    fields: *postFields

  - name: spotlights
    label: Spotlights
    label_singular: Spotlight
    folder: src/data/blog/_spotlights
    extension: mdx
    create: true
    delete: false
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    media_folder: /src/assets/images/spotlights
    public_folder: "@/assets/images/spotlights"
    sortable_fields: [pubDatetime, title]
    fields: *postFields
```

YAML anchors (`&postFields` / `*postFields`) resolve at parse time, so Sveltia
receives a fully-expanded object and never sees the anchors — safe with any
compliant YAML parser. (If we ever distrust it, the fallback is to duplicate the
field block across the three collections.)

## Sequencing — why deferred

Phase A edits published blog prose (6 renames + 6 content fixes). We'd rather
land other pending updates first and not entangle them with substantial blog
content changes. When we pick this up:

1. Do it as its own focused change on `draft`.
2. Phase B (images, config-only) is low-risk and *could* go first/independently
   — but per-collection `media_folder` only takes effect once the `events` /
   `spotlights` collections exist, so it naturally rides with Phase A.

## Validation checklist (when executed)

- [ ] `pnpm build` passes after the renames + MDX fixes (catches any remaining
      MDX-hostile syntax). This is the real test of Phase A2.
- [ ] All 9 subfolder posts still render and keep their existing `/posts/<slug>`
      URLs (renames must not change slugs).
- [ ] `dimopoulos` spotlight LinkedIn link now resolves (was broken).
- [ ] `config.yml` parses as valid YAML and loads in the CMS without schema
      errors; Events and Spotlights collections appear with all entries listed.
- [ ] Asset collections appear in the Asset Library / image picker; editors can
      browse into Arcjam / Events / Spotlights / Editor and select existing images.
- [ ] Inserting an image from the Events asset collection writes an
      `@/assets/images/events/…` reference (alias preserved) and the image renders
      optimized after build — NOT a raw web path.
- [ ] (If per-collection defaults are set) uploading from within a new Events post
      defaults into `src/assets/images/events/`.

## Open questions / future work

- **`ogImage` CMS field.** If we later expose `ogImage` for editors, it can't use
  the `@` alias (relative-path resolution only) and its depth varies by folder —
  needs its own design (e.g. a widget that emits the correct relative depth, or a
  schema change to accept alias paths). Don't add it casually.
- **`_releases` / `examples` cleanup.** 14 theme-sample drafts still in the repo.
  Separate decision: delete, or keep as reference.
- **Asset-collection `public_folder` alias.** The one unverified behavior: that an
  asset collection with `public_folder: "@/assets/..."` writes the alias literally
  (like the global setting does) rather than coercing it to a web URL. Confirm on
  preview before relying on it; the fallback is per-collection `media_folder` only.
- **Folder taxonomy is fixed.** Separate collections mean editors can't invent new
  subfolders from the UI. That's intentional (events/spotlights is a deliberate
  taxonomy); if arbitrary nesting is ever needed, revisit Sveltia's `nested`
  collection mode instead.
```