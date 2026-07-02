# Theme Conformance Guide

This is the **living standard** for keeping the site visually consistent and easy to re-theme. It is not a point-in-time plan — it applies to every new page, component, and feature. The decision record that produced it is [plans/2026-06-27-jobs-theme-conformance.md](./plans/2026-06-27-jobs-theme-conformance.md), and the jobs board ([src/pages/jobs.astro](../src/pages/jobs.astro) + [src/components/JobCard.astro](../src/components/JobCard.astro)) is the first page brought fully into conformance under it — use it as a worked example.

> **Update 2026-06-28 — aligned to AstroPaper v6's 7-token system.** As part of the v6 parity migration ([plans/2026-06-28-astropaper-v6-parity-migration.md](./plans/2026-06-28-astropaper-v6-parity-migration.md), Decision 1), the palette moved from 5 color-only tokens to v6's **7 tokens** — adding **`--accent-foreground`** (text/icon color on accent fills) and **`--muted-foreground`** (the sanctioned secondary-text color). Tokens now live in [src/styles/theme.css](../src/styles/theme.css). **This reverses the previous "opacity, never a secondary-text token" rule:** de-emphasized text now uses **`text-muted-foreground`** (matching upstream so v6 components merge cleanly), and text on an accent surface uses **`text-accent-foreground`**. The `--muted-foreground` hex is tuned to approximate our prior `opacity-75/80` look; **if secondary text reads too light/dark, retune `--muted-foreground` in `theme.css` first** (currently light `#646566`, dark `#cacdd0`). `opacity-*` is still fine for incidental, non-text de-emphasis.

## Policy

For any styling need, use AstroPaper's sanctioned pattern if one exists — **borders** for separation (never shadows/depth), **`text-muted-foreground`** for secondary text (and `opacity-*` for incidental fades), **`bg-muted`** for surface fills/hover, the **seven color tokens** consumed through semantic Tailwind utilities (`bg-*`/`text-*`/`border-*`, never raw `var()` in a non-bespoke component's `<style>` when a utility exists), and **Tailwind's default rem scale** via utilities for type/spacing/radius/border-width/width (`max-w-app`, or `Main`'s `wide` prop for wide bodies).

For genuinely-novel UI with no sanctioned analog, build in the theme's **spirit** using those same primitives — flat, bordered, existing tokens, opacity, default scale — minimal, never a new visual language.

**Introducing a new token or a new visual language requires a separate, explicit, intentional decision recorded in `docs/plans/`.** A feature page never extends the theme unilaterally, and a normalization pass never *codifies* a departure (e.g. "there's no theme equivalent" is the tell that a value is an invention — reach for the sanctioned primitive, do not enshrine the invention).

## The sanctioned vocabulary

The theme contract is **color only**: seven tokens (`--background`/`--foreground`/`--accent`/`--accent-foreground`/`--muted`/`--muted-foreground`/`--border`) in [src/styles/theme.css](../src/styles/theme.css), exposed to Tailwind via `@theme inline` as `bg-*`/`text-*`/`border-*`. The universal selector ships `border-border` + `outline-accent/75` to every element, so structure-by-border is the site-wide default. Everything non-color uses Tailwind's default scale.

| Concept | Sanctioned pattern | NOT in the vocabulary |
|---|---|---|
| Separation / structure | Borders + dashed underlines + whitespace (`Card.astro`, `*{border-border}`) | box-shadow / elevation; inset or double decorative borders |
| Text de-emphasis | `text-muted-foreground` for secondary text; `opacity-75`/`opacity-60` on `text-foreground` for incidental fades (`figcaption`, `blockquote`) | inventing a NEW secondary-text token beyond `--muted-foreground` |
| Surfaces / panels / hover | `bg-muted` (+ optional `/75`) with `border` + default `rounded`/`p-*` | color-mix panel fills; any surface token beyond `--muted` |
| Hover / active / selected | `hover:text-accent` / `hover:border-accent` / `marker:text-accent` / `.active-nav` underline / `accent-color: var(--accent)` | hover background tints other than `bg-muted`; hover shadows |
| Type / spacing / radius / width | Tailwind default steps via utilities (`text-xs/sm/lg`, `p-*`, `rounded/rounded-sm`, `border/border-2`, `max-w-app`, `wide` prop) | bespoke px font-sizes, fractional borders (1.5px), rem-literal radii, `clamp()` fluid type, letter-spacing literals |
| Color application | Semantic utilities off the seven tokens | raw `var(--token)` in a non-bespoke component's `<style>`; hardcoded hex/rgb/hsl |

## Re-theming is a top-level edit (the payoff)

Because every surface routes through the seven tokens, **re-theming is a single edit in [src/styles/theme.css](../src/styles/theme.css), not a per-page sweep.** Changing one token value — e.g. retuning `--muted` — instantly recolors every surface and hover state across the whole site (inline code, search cards, the copy button, the scrollbar, the jobs filter UI) with zero component edits. That propagation is the entire reason for the rules above, and it is why this guide deliberately never names specific hues: a token's _role_ (`--muted` = surface/hover fill) is stable, while its _value_ is yours to retune at the top whenever you like. A page that hardcodes a hue or invents its own token opts out of that propagation — exactly the drift this guide prevents.

## Per-page / per-component audit rubric

Run this against any page or component. Each checked box is a **departure to fix** — route every fix back to a primitive above, never a new token.

```
COLOR
[ ] Hardcoded hex/rgb/hsl/named color literal → semantic utility off the 7 tokens.
[ ] Raw var(--token) in a <style> block where a utility exists → utility class
    (color:var(--foreground)→text-foreground; border-color:var(--border)→border-border).
    Allowed only in genuinely-custom components (GameEmbed) or JS that can't be a utility.
[ ] Invented color token duplicating a theme concept: --x-subtle/-secondary (=text-muted-foreground),
    --x-panel/-surface (=bg-muted), --x-border (=border-border), --x-on-accent (=text-accent-foreground),
    --x-hover/-shadow (=none).

SEPARATION & DEPTH
[ ] box-shadow / drop-shadow / inset ::before|::after "double border" → real border.
[ ] Single-mode bake: any color-mix()/rgba derived from --foreground/--background used
    for a shadow/overlay (inverts across light/dark) → remove.

DE-EMPHASIS
[ ] Dimmed TEXT via a hardcoded color/color-mix instead of `text-muted-foreground`
    (or `opacity-*` on `text-foreground` for incidental fades).

SCALE (Tailwind default steps only)
[ ] Off-scale border-width (1.5px, 3px) → border / border-2.
[ ] rem/px-literal border-radius → rounded / rounded-sm / rounded-lg.
[ ] px/rem font-size or clamp() fluid type → text-xs/sm/base/lg (+ sm: step).
[ ] Literal spacing hack (<br>, fixed px margin) → m-*/p-*/gap-*/space-y-*.
[ ] Bespoke letter-spacing (0.08em/0.12em) → tracking-* step.

LAYOUT & CONTRACTS
[ ] Bespoke width (max-w-6xl / max-w-[..]) → app-layout / max-w-app, or Main `wide`
    (a functional wide-body need is a carve-out — e.g. a two-column board).
[ ] Cross-file CSS-var contract (a component reads a --var from another file) → verify
    it's actually defined (catches orphans); prefer self-contained utilities.

DECISION GATE
[ ] Did this introduce ANY new token or visual language? If yes and there's no
    docs/plans entry → revert to a sanctioned primitive.
```

Because the theme is color-only and `*` pre-wires `border-border`, the audit is largely mechanical: grep for the departure signatures (`box-shadow`, `shadow-` on content, `color-mix` on `--foreground`-as-text, surface fills that aren't `bg-muted`, `[NNpx]`, fractional borders, rem-literal radii, `clamp(`, `letter-spacing`, widths past `max-w-app`, `var(--` inside a non-bespoke `<style>`) and map each hit to a rubric row.
