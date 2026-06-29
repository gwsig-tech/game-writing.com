# Jobs Page — Theme Conformance Normalization Plan

**Date:** 2026-06-27
**Status:** Proposed -- under owner review; not yet implemented.
**Supersedes:** the two 'keep' decisions (keep the paper look; keep the custom filter tokens) in [2026-06-26-jobs-page-normalization.md](./2026-06-26-jobs-page-normalization.md). The shell + a11y fixes from that plan are correct and already applied.
**Scope:** Styling conformance only -- the ~177-line filter `<script>` and the data flow are untouched.
**Provenance:** Synthesized by the jobs-theme-conformance-normalization workflow (4 research threads, each red-teamed). Governing principle: conform to AstroPaper's flat/minimal design language, do not extend it.


## TL;DR

Bring the jobs page back **into** AstroPaper's flat/minimal language rather than growing the theme to fit the page. Concretely: flatten the "paper" look (delete all four box-shadows and the inset double-border pseudo-element — the site separates with borders, never depth), replace the two invented dimmed-text colors (`--jobs-muted`/`--jobs-subtle`) with **opacity on `text-foreground`** (the theme has no secondary-text token), and route the page's raw `var(--…)`-in-`<style>` colors through the existing semantic utilities (`text-accent`/`text-foreground`/`border-border`/`bg-muted`). The genuinely-novel filter UI (multiselect dropdowns, sticky two-column board) has no sanctioned analog, so it **stays** — but gets a minimal in-spirit flat treatment: one sanctioned surface (`bg-muted`), default-step borders/radii, accent-on-hover, and a preserved focus ring. Net: zero new tokens, zero shadows, every color from the five theme tokens.

| Priority | Item | Type |
|---|---|---|
| P0 | Delete `--jobs-shadow` + all 4 box-shadows + inset `::after` double-border | reverses June decision |
| P0 | Replace `--jobs-muted`/`--jobs-subtle` text colors with opacity utilities | reverses June decision |
| P1 | Delete `--jobs-panel`/`-strong` → `bg-muted`; `--jobs-border` → `border-border`; `--jobs-hover` → accent/`bg-muted`/focus-ring | reverses June decision |
| P1 | Fix dead `--jobs-ink` orphan at JobCard.astro:151 → `text-foreground` | conforms |
| P2 | Normalize bespoke scale: 1.5px borders, rem-literal radii, px/rem font-sizes, `clamp()`, letter-spacing, `<br>` spacer | conforms |
| P3 | Adopt the whole-site conformance rubric | process |

---

## The yardstick: AstroPaper's sanctioned vocabulary

The theme contract (`src/styles/global.css:6-29`) tokenizes **color only** — five tokens (`--background`/`--foreground`/`--accent`/`--muted`/`--border`) per `[data-theme]`, exposed to Tailwind via `@theme inline` as `bg-*`/`text-*`/`border-*` utilities. Everything non-color is left to Tailwind's default scale. The universal selector ships `border-border` + `outline-accent/75` to every element (`global.css:32-33`), so structure-by-border is the site-wide default.

| Concept | Sanctioned pattern | Evidence | NOT in the vocabulary |
|---|---|---|---|
| **Separation / structure** | Borders + dashed underlines + whitespace | `Card.astro:16-31` (no box, no shadow); `global.css:32`; `typography.css:57` (`border border-border`) | box-shadow / elevation; inset or double decorative borders |
| **Text de-emphasis** | `opacity-75` / `opacity-80` on `text-foreground` | `typography.css:51` (figcaption), `:78` (blockquote) | any secondary-text or "subtle" color token |
| **Surfaces / panels** | `bg-muted` (+ optional `/75`) with `border` + default `rounded`/`p-*` | `search.astro:38`; `PostDetails.astro:252`; `typography.css:70` | color-mix panel fills; any surface token beyond `--muted` |
| **Hover / active** | `hover:text-accent` / `hover:border-accent` / `marker:text-accent` / `.active-nav` wavy underline | `Tag.astro:18-24`; `LinkButton.astro:13-18`; `global.css:65-67`; `typography.css:39` | hover background fills; hover shadows |
| **Type / spacing / radius / width** | Tailwind default steps via utilities (`text-xs/sm/lg`, `p-1/p-2`, `rounded/rounded-sm`, `border/border-2`, `max-w-app`; `wide` prop for wide bodies) | `global.css:57-63`; `typography.css:104,127`; `Main.astro:8-13` | bespoke px font-sizes, 1.5px borders, rem-literal radii, `clamp()` fluid type, letter-spacing literals |
| **Color application** | Semantic utilities off the five tokens (`bg-*`/`text-*`/`border-*`) | `Card.astro:20`; `Tag.astro` | raw `var(--token)` in a `<style>` block of a non-bespoke component (allowed only in genuinely-custom components like `GameEmbed`, or JS that can't be a utility, e.g. `BackToTopButton.astro:62`) |

Any value that can't reduce to one of these rows is a departure to **undo** — not a reason to extend the theme.

---

## The two headline departures

### Drop shadow / the "paper" look

**Where:** `.jobs-paper` sets `box-shadow: 0 18px 50px var(--jobs-shadow)` (`jobs.astro:424`) plus an `::after` inset double border (`428-436`); the open-filter `<summary>` adds `box-shadow: 2px 3px 0 var(--jobs-shadow)` (`482`); the dropdown `.filter-menu` adds `box-shadow: 0 1rem 2rem var(--jobs-shadow)` (`499`). The token `--jobs-shadow = color-mix(in srgb, var(--foreground) 18%, transparent)` (`417`).

**Why it's a departure:** The flat site separates with borders and dashed underlines, never depth. There is **no shadow token in the contract** and no analog anywhere — the lone `shadow-xl` on the site is the mobile floating Back-to-Top button, and it is explicitly killed at desktop (`BackToTopButton.astro:18-19`, `md:shadow-none`). The inset `::after` double border is a *second* invented visual language layered on top: the flat site uses one border per element, never border-plus-pseudo-border.

**Dark-mode bug (higher priority):** because `--jobs-shadow` is baked from `--foreground` (near-white `#f4f7f5` in dark mode), the "drop shadow" inverts into a **white halo** in dark mode. This isn't merely off-spec — it actively looks broken.

**Verdict — FLATTEN, do not add a shadow token.** Delete `--jobs-shadow` (`417`), all four `box-shadow` declarations (`424`, `482`, `499`, and the `[open]` one), and the `::after` double border (`428-436`). The residual `.jobs-paper` is already `background: var(--background)` (`423`) inside a `rounded-lg border-2` box (`jobs.astro:76`) — i.e. a clean bordered card with **no replacement fill needed**. Honest note: there was never a prior shadow/elevation concept on this site, and we are deliberately **not** introducing one. The single `border-2` is the separation.

### The invented "muted" text colors

**Where they're defined:** `--jobs-muted = color-mix(... foreground 72% ...)` (`jobs.astro:407`) and `--jobs-subtle = color-mix(... foreground 58% ...)` (`408`).

**Where they're used as TEXT:**
- `JobCard.astro:156` — `.job-card-meta`, `.job-card-description` → `var(--jobs-muted, …)`
- `JobCard.astro:160` — `.job-card-date` → `var(--jobs-subtle, …)`
- `jobs.astro:447` — `.jobs-muted` (the "no results" message, used at markup `212`)
- `jobs.astro:510` — `.filter-menu > p` caption
- `jobs.astro:518` — `.filter-search`/`.terms-search` labels
- `jobs.astro:546` — input `::placeholder`
- `jobs.astro:561` — `.filter-option` resting text
- `jobs.astro:576` — `.filter-option small` count

**Why it's a departure:** the theme de-emphasizes text with **opacity on `text-foreground`** (`typography.css:51` `opacity-75`, `:78` `opacity-80`) and has **no secondary-text color token by design**. Critically, `--muted` is a **surface-fill token only** (AstroPaper docs: "Card and scrollbar background color for hover state"; applied as `bg-muted` at `search.astro:38`, `typography.css:70`, `PostDetails.astro:252`). Using a color named "muted" *as text* collides conceptually with the theme's surface token — a naming hazard worth calling out: `--jobs-muted` (text) and `--muted` (surface) mean opposite things.

**Verdict — replace with opacity, no new token.** Delete both tokens and express de-emphasis as `text-foreground` + an opacity utility matching the existing scale:
- meta / description / resting filter-option text → `opacity-75` (matches figcaption)
- dates / captions / counts / placeholders (the most secondary) → `opacity-60` (slightly dimmer than blockquote's `opacity-80`, consistent with their tertiary role)

Verify contrast after conversion where opacity stacks (e.g. dimmed text inside a `bg-muted` hover row).

---

## Full departures → normalization table

| Element | file:line | Current | Conforming replacement | Novel? |
|---|---|---|---|---|
| Paper drop shadow | jobs.astro:424 | `box-shadow: 0 18px 50px var(--jobs-shadow)` | delete | no |
| Inset double border | jobs.astro:428-436 | `::after { inset:5px; border:1px … }` | delete | no |
| Open-summary shadow | jobs.astro:482 | `box-shadow: 2px 3px 0 var(--jobs-shadow)` | delete; open-state = `hover:border-accent` / rotate caret only | dropdown |
| Dropdown-menu shadow | jobs.astro:499 | `box-shadow: 0 1rem 2rem var(--jobs-shadow)` | delete; rely on **opaque** `bg-muted` + `border-border` | dropdown |
| `--jobs-shadow` token | jobs.astro:417 | `color-mix(foreground 18%)` | delete (also fixes dark-mode halo) | no |
| `--jobs-muted` / `-subtle` (text) | jobs.astro:407-408 → JobCard:156,160; jobs:447,510,518,546,561,576 | dimmed text colors | `text-foreground` + `opacity-75` / `opacity-60` | no |
| `--jobs-panel` / `-strong` | jobs.astro:410-411 → 463,497,538 | color-mix surface fills | `bg-muted` (see overlay caution) | dropdown |
| `--jobs-border` | jobs.astro:409 → 422,439,461,495,536,582; JobCard:142 | re-tinted border | `border-border`; **delete** redundant `.job-card{border-color}` (JobCard:142) — `*{border-border}` already colors the dashed dividers | no |
| `--jobs-hover` | jobs.astro:416 → 567,604,608 | accent-12% fill | split by state — see below | dropdown / list |
| Dead `--jobs-ink` | JobCard.astro:151 | `var(--jobs-ink, var(--foreground))` (token defined nowhere) | `text-foreground` (fallback already fires — safe no-op flatten) | no |
| 1.5px borders | jobs.astro:461,495,536 | `border: 1.5px …` | `border` (1px) | dropdown |
| rem-literal radii | jobs.astro:433,462,496,537,559 | `0.35/0.45/0.4/0.2rem` | `rounded-sm` / `rounded` | dropdown |
| px/rem font sizes | jobs.astro:**83** (`text-[11px]`, class swap); 511,519,541 (raw rem in `<style>`, CSS deletion); 585,597 | `0.7/0.75/0.8rem` etc. | `text-xs` / `text-sm` | dropdown |
| letter-spacing literals | jobs.astro:83 (`0.12em`), 529 (`0.08em`) | bespoke tracking | `tracking-wide` / `tracking-wider` (or drop) | dropdown |
| `clamp()` fluid type | JobCard.astro:147 | `clamp(1.35rem,2.4vw,1.9rem)` — the **only** fluid type on the site | `text-xl sm:text-2xl` (mirrors how `.job-card-title` already does `text-base sm:text-lg`) | no |
| `<br>` spacer | jobs.astro:219 | bare `<br>` before BackToTopButton | margin utility (`mt-*` on the button/wrapper) | no |
| Redundant inner width | jobs.astro:75 | `max-w-6xl` nested inside an already-`wide` main | KEEP — see note | board |
| `.clear-picker` divider | jobs.astro:582 | `border-top: 1px dashed var(--jobs-border)` | `border-t border-dashed` (border-border) | dropdown |

### Genuinely-novel filter UI — minimal in-spirit treatment (do NOT over-strip)

These have no sanctioned AstroPaper analog. Build them in-spirit; the items below are **justified minimal departures**, not things to flatten away:

- **Dropdown menu surface** (`.filter-menu`, `489-500`) is `position:absolute; z-index:20`, floating **over** the job list. Use **solid `bg-muted`** + `border-border` — not `bg-muted/75`. The `/75` alpha is fine for inline surfaces (inline code, search card) but would let the list text beneath the overlay bleed through. The opaque fill is what occludes the list; the deleted shadow was never doing that job.
- **The `<summary>` trigger** (`454-468`) is a custom `<select>` surrogate and legitimately needs a bordered, clickable affordance — do **not** flatten it to a bare text link. Conform the box: `border border-border` (drop 1.5px), `rounded-sm` (drop 0.45rem), surface `bg-muted` (drop `--jobs-panel`), open/hover state = `hover:border-accent` + accent text (drop the box-shadow).
- **Search `<input>`s** (`533-542`) — the theme has *zero* styled text inputs (search.astro uses Pagefind's own UI). Inputs functionally require a visible border to read as fields: `border border-border`, `rounded-sm`, `bg-background` or `bg-muted`, `text-foreground`, placeholder via `opacity`. Do not strip the border chasing minimalism.
- **State feedback** — split the three uses of `--jobs-hover` by semantics rather than collapsing all to one fill:
  - **Hover** on a filter-option / job-row → `bg-muted` (the sanctioned hover surface).
  - **Checked** (`.filter-option:has(input:checked)`, `566`) → mark with the **accent token** (`text-accent` + `font-bold`, or an accent left-border), **not** `bg-muted` — otherwise a selected row is indistinguishable from the `bg-muted` panel it sits on. Accent is sanctioned, so this stays in-spirit.
  - **Keyboard focus** (`.job-row-link:focus-visible`, `607`) is an a11y affordance — **keep an indicator**. Replace the tint fill with the theme's `outline-accent/75` ring (already applied to `*` at `global.css:33,48`). Do not silently remove focus visibility.
- **Board width** `max-w-6xl` (`jobs.astro:75`) — the page already renders through `<Main wide>` (`53`), the sanctioned wide path (`Main.astro:8-13`). An 18rem sticky sidebar + list grid genuinely does not fit `max-w-3xl`, so this is the row-5 "functional need" carve-out — **keep it**. Minor: it's a second width cap inside an already-`wide` main; optional cleanup is to let the grid drive width, but do **not** revert to `max-w-app`.
- **Scroll cap** `max-height:19rem; overflow-y:auto` on `.filter-options` (`550-551`) is functional (a board with many companies would otherwise produce an unusably tall dropdown) — keep it; the rem can become a `max-h-*` utility but it's not a color/token departure.
- **`accent-color: var(--accent)` on checkboxes** (`jobs.astro:572`) is the one genuinely in-spec custom rule — `accent-color` has no Tailwind utility and correctly uses the accent token. **Keep it; don't strip it while removing neighbors.**

---

## What "utility migration" means (plainly)

"Utility migration" = moving styling out of hand-written `var(--…)` declarations inside `<style>` blocks and into the **semantic Tailwind utility classes** the theme already generates from the five tokens, applied in the markup — the way every canonical component already does it.

**Before / after, from the actual code:**

1. **Raw var() color → semantic utility.** `JobCard.astro:145-146` `.job-card-company { color: var(--accent); … }` → delete the rule, add `text-accent` to the `<p>` at `JobCard.astro:86` (exactly how `Card.astro:20` colors its link). Likewise `.job-card-title { color: var(--jobs-ink, var(--foreground)); }` (`150-152`) → `text-foreground` class (or delete — the title inherits foreground anyway).

2. **Arbitrary value → Tailwind scale step.** `jobs.astro:83` `tracking-[0.12em] text-[11px]` → `tracking-wider text-xs`. The fluid `clamp(1.35rem,2.4vw,1.9rem)` at `JobCard.astro:147` → `text-xl sm:text-2xl`.

3. **Raw var() surface → utility on the element.** `.filter-picker summary { background: var(--jobs-panel); border: 1.5px solid var(--jobs-border); border-radius:0.45rem; }` (`461-463`) → `class="… bg-muted border border-border rounded-sm"`.

**Honest split.** Most of `JobCard.astro`'s entire `<style>` block (`140-162`) migrates to utilities and can be **deleted** — it's all color via raw var(). On `jobs.astro`, the *colors, borders, radii, and font-sizes* migrate cleanly; what legitimately **stays in `<style>`** is the structural/positional CSS that has no clean utility and is genuinely-custom: `position:absolute; z-index:20` on the menu, the `details/summary` marker reset (`477-479`), the caret rotation (`485-487`), the grid template on `.filter-option` (`556`), and `accent-color` (`572`). That's the honest "genuinely-custom component" residue — analogous to `GameEmbed`.

**Honest benefit.** This is **mostly conformance + readability**, not a runtime change — `text-foreground` and `var(--foreground)` resolve to the same value today. The *one* concrete future-proofing payoff: if a later theme upgrade retunes the `@theme inline` layer or how a utility maps to a token, markup using `text-foreground`/`bg-muted` follows automatically, whereas hand-written `var(--foreground)` in a `<style>` block only tracks the raw token and silently misses any utility-layer change. It also makes the page greppable by the same audit signatures as the rest of the site.

**Recommended scope.** Do the full migration for `JobCard.astro` (small, high-value — it's a *reusable component*, the canonical-pattern surface, so worst place for raw var()). For `jobs.astro`, migrate all color/border/radius/font-size to utilities; leave only structural CSS in `<style>`. This is a styling-only pass — the ~177-line filter `<script>` and data flow are untouched.

---

## Re-audit of the June normalization plan

`docs/plans/2026-06-26-jobs-page-normalization.md`. Verdict per decision:

| June decision | plan line | Normalize or codify-a-departure? | Corrected stance |
|---|---|---|---|
| Add `id="main-content"` (skip-link fix) | 40 | **Normalize (CORRECT)** — already applied via `Main.astro:21` | Keep. Done. Do not redo. |
| Add `<Breadcrumb/>` | 42 | **Normalize (CORRECT)** — applied via `Main.astro:18` | Keep. Done. |
| Remove monospace re-declaration | 43 | **Normalize (CORRECT)** — no `font-family` in current `<style>` | Keep. Done. |
| Drop `--jobs-surface`/`--jobs-ink` definitions | 45 | **Half-right / left a bug** | `--jobs-ink` definition was dropped but the **reference at JobCard.astro:151 was left** → dead orphan. Finish the job: change `:151` to `text-foreground`. |
| **Keep the "paper" look (box + heading scale)** | 21, 33, 37 | **CODIFIED A DEPARTURE** | Overturn. The flat site has no shadow concept; the foreground-baked shadow inverts in dark mode. Flatten to the existing `border-2`. |
| **Keep the seven custom filter tokens** | 48-49 | **CODIFIED A DEPARTURE** | Overturn. Delete `--jobs-muted/subtle/panel/panel-strong/border/hover/shadow`; re-express via sanctioned primitives. |
| JSON-LD fix (Workstream B) | 51-59 | Out of scope here (separate concern) | Unaffected by this pass. |

**The reasoning error to retire.** The plan justified keeping the tokens with *"`color-mix()` blends with no theme equivalent"* (line 49). That rationale is exactly backwards: the equivalent isn't another color-mix, it's the sanctioned **non-token** pattern. `--jobs-muted/-subtle` → **opacity**. `--jobs-panel/-strong` → **`bg-muted`**. `--jobs-border` → **`border-border`** (already on every element). `--jobs-shadow` → **no shadow at all**. "There's no theme equivalent" is the *tell* that a value is an invention outside the contract — under the governing principle, that's the signal to delete it and reach for a primitive, not to enshrine it. The shell + a11y fixes (rows 1-3 above) were genuinely good normalization and must **not** be undone.

---

## Whole-site conformance: principle + reusable rubric

**POLICY (one paragraph).** For any styling need, use AstroPaper's sanctioned pattern if one exists — **borders** for separation (never shadows/depth), **opacity** for text de-emphasis (never a new text color), **`bg-muted`** for surface fills, the **five color tokens** consumed through semantic Tailwind utilities (never raw `var()` in a non-bespoke component's `<style>` when a utility exists), and **Tailwind's default rem scale** via utilities for type/spacing/radius/border-width/width (`max-w-app`, or `Main`'s `wide` prop for wide bodies). For genuinely-novel UI with no sanctioned analog, build in the theme's **spirit** using those same primitives — flat, bordered, existing tokens, opacity, default scale — minimal and never a new visual language. Introducing a **new token or a new visual language requires a separate, explicit, intentional decision recorded in `docs/plans/`** — a feature page never extends the theme unilaterally.

**Copy-pasteable per-page/per-component rubric** (each box = a departure to FIX; route every fix back to a primitive, never a new token):

```
COLOR
[ ] Hardcoded hex/rgb/hsl/named color literal → semantic utility off the 5 tokens.
[ ] Raw var(--token) in a <style> block where a utility exists → utility class
    (color:var(--foreground)→text-foreground; border-color:var(--border)→border-border).
    Allowed only in genuinely-custom components (GameEmbed) or JS that can't be a utility.
[ ] Invented color token duplicating a theme concept: --x-muted/-subtle (=opacity),
    --x-panel/-surface (=bg-muted), --x-border (=border-border), --x-hover/-shadow (=none).

SEPARATION & DEPTH
[ ] box-shadow / drop-shadow / inset ::before|::after "double border" → real border.
[ ] Single-mode bake: any color-mix()/rgba derived from --foreground/--background used
    for a shadow/overlay (inverts across light/dark) → remove.

DE-EMPHASIS
[ ] Dimmed TEXT as a color/color-mix instead of opacity-* on text-foreground.

SCALE (Tailwind default steps only)
[ ] Off-scale border-width (1.5px, 3px) → border / border-2.
[ ] rem/px-literal border-radius → rounded / rounded-sm / rounded-lg.
[ ] px/rem font-size or clamp() fluid type → text-xs/sm/base/lg (+ sm: step).
[ ] Literal spacing hack (<br>, fixed px margin) → m-*/p-*/gap-*/space-y-*.
[ ] Bespoke letter-spacing (0.08em/0.12em) → tracking-* step.

LAYOUT & CONTRACTS
[ ] Bespoke width (max-w-6xl / max-w-[..]) → app-layout / max-w-app, or Main `wide`
    (functional wide-body need = carve-out, e.g. the two-column board).
[ ] Cross-file CSS-var contract (a component reads a --var from another file) → verify
    it's actually defined (catches orphans like --jobs-ink); prefer self-contained utilities.

DECISION GATE
[ ] Did this introduce ANY new token or visual language? If yes and there's no
    docs/plans entry → revert to a sanctioned primitive.
```

This is mechanical because the theme is color-only and `*` pre-wires `border-border`: grep for the departure signatures (`box-shadow`, `shadow-` on content; `color-mix` on `--foreground`-as-text; surface fills that aren't `bg-muted`; `[NNpx]`, fractional borders, rem-literal radii, `clamp(`, `letter-spacing`, widths past `max-w-app`; `var(--` inside non-bespoke `<style>`) and map each hit back to a rubric row.

---

## Recommended sequence

Behavior stays identical — the filter `<script>` and data flow are untouched. Ordered by leverage-vs-risk:

1. **[reverses June decision]** Delete `--jobs-shadow` (`jobs.astro:417`) + all four box-shadows (`424`, `482`, `499`, `[open]`) + the `::after` inset double border (`428-436`). Also fixes the dark-mode halo. *Effort: low. Highest visual impact.*
2. **[reverses June decision]** Delete `--jobs-muted`/`--jobs-subtle` (`407-408`); convert the eight text sites (JobCard:156,160; jobs:447,510,518,546,561,576) to `text-foreground` + `opacity-75`/`opacity-60`. *Effort: low-med.*
3. **[reverses June decision]** Delete `--jobs-panel`/`-strong` (`410-411`) → solid `bg-muted` on summary/menu/inputs (`463,497,538`); delete `--jobs-border` (`409`) → `border-border` everywhere (`422,439,461,495,536,582`; JobCard:142 — delete the redundant rule); replace `--jobs-hover` (`416`) per state: hover→`bg-muted` (`567,604`), checked→accent (`566`), focus→`outline-accent` ring (`607`). *Effort: med.*
4. **[conforms]** Fix the dead `--jobs-ink` orphan: `JobCard.astro:151` → `text-foreground` (or delete the rule). *Effort: trivial.*
5. **[conforms]** Normalize the bespoke scale: 1.5px→`border` (`461,495,536`); rem radii→`rounded-sm`/`rounded` (`433,462,496,537,559`); font-sizes→`text-xs`/`text-sm` (`83,511,519,541,585,597`); `clamp()`→`text-xl sm:text-2xl` (JobCard:147); letter-spacing→`tracking-wide(r)` (`83,529`); `<br>`→margin utility (`219`). *Effort: med, mechanical.*
6. **[conforms]** Utility migration: move remaining colors out of `JobCard.astro`'s `<style>` (delete most of `140-162`) and `jobs.astro`'s `<style>` into semantic utilities in markup; leave only structural CSS (positioning, marker reset, grid template, `accent-color`). *Effort: med.*
7. **[conforms]** Optional: collapse the redundant inner `max-w-6xl` (`jobs.astro:75`) by letting the grid drive width — keep the board wide, just remove the double cap. *Effort: low; verify layout.*
8. **[process]** Add the conformance policy + rubric to `docs/plans/` and rewrite the June plan's two "keep" decisions as "remove — codified departures." *Effort: low.*

Verify after: `pnpm build && pnpm lint`; visually diff `/jobs` in both light and dark themes (the dark-mode halo should be gone, filter dropdowns still legible as raised opaque overlays, checked rows visibly distinct, keyboard focus still indicated).