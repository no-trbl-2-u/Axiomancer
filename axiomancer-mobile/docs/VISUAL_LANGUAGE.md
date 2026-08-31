# Visual language — The Woodcut Codex

> Written at the close of the V-sequence (Phase V8, 2026-08-31). The
> owner's brief that started this redesign (2026-08-08, full creative
> freedom on visual direction) and its ratification (2026-08-28, live
> continent-playtest: *"OMG! This art direction is amazing!"*) are
> recorded in `plan/phases/phase_V_visual_redesign_masterplan.md` — this
> doc is the finished system that brief produced, for anyone building a
> new screen or asset against it. `SVG_ASSET_SPEC.md` tracks the
> per-component placeholder → real-art checklist; `docs/asset-conventions.md`
> owns the raster ingest/provenance pipeline. This doc is the middle
> layer: the design language itself.

## The identity, in one line

*FromSoftware × Inscryption × illuminated manuscript.* Every screen is a
page of a chronicle: ink-on-parchment woodcut art, iron and wax
furniture, hairline rules, ✠ eyebrows, lowercase-roman in-world
numerals, dark-gothic type. Not a theme applied on top of the game —
the completion of the identity the game already half-owned since the
2026-05-23 design handoff.

## Color: tokens, never hex

Every screen reads color through `AXM.*` (from `usePalette()` /
`makeStyles()` in `theme/runtime`), never a baked hex literal. `AXM` is
a **frozen snapshot of the active theme**, resolved once at module-load
— see `theme/palette.ts` for the mechanism.

The base identity is one dark-gothic palette; the *accents* are
theme-driven so the world can shift as the pilgrim moves between
regions without touching components. Five themes ship today
(`theme/palette.ts` `THEME_SPECS`), default `ashen-gold`:

```
ashen-gold        coastal-verdant     ember-depths
frost-marrow      plague-bloom
```

The 7 base hues every theme authors (a new theme needs only these —
translucent washes/dividers/overlays derive automatically via
`makePalette`):

```
AXM.bg        near-black background
AXM.parchment main text / inactive icon
AXM.blood     HP, danger, bleed
AXM.sulfur    mana, selected, active
AXM.rust      friendship, rust accents
AXM.bone      secondary text, inactive tabs, hints
AXM.ash       borders, disabled — NOT body/hint text (too low-contrast
              against `AXM.bg`; see Phase V8 critic-loop finding, the
              cutscene hint fix in `app/cutscene/index.tsx`)
```

All monochrome assets (icons, glyphs) render via `currentColor` /
a `color` prop so they inherit the token without separate colored
variants.

## Type

`theme/axm.ts` `FONTS` + `TYPE`. Blackletter/serif identity, **not**
theme-driven (only color shifts per-theme, never the type system):

```
FONTS.gothic  PirataOne        — display, h1, in-world headers
FONTS.serif   IMFellEnglish    — h2, body prose (dialogue, flavor text)
FONTS.sans    BebasNeue        — eyebrows, labels, UI chrome
FONTS.mono    JetBrainsMono    — codex header strips, hints, stat rows
```

## Furniture: the page-of-a-chronicle chrome

- **✠ eyebrow + hairline rule** — the standing header convention
  (small-caps or mono label prefixed with ✠, a 1px rule beneath).
  Audited into shared components in V3; see `EventCodexHeader.tsx` /
  `ExplorationCodexHeader.tsx` for the two-token mono strip variant
  (blood-accent left token, bone right token).
- **`TornPanel`** (`components/TornPanel.tsx`) — the torn-paper-edge
  panel: a procedural jagged SVG mask over a solid backing color,
  seeded so edges vary without new art. Used for card/panel furniture
  needing a hand-cut edge instead of a hard rectangle.
- **Iron/wax furniture** — rivets, seals, hairline borders in `AXM.ash`/
  `AXM.parchment` — the metal-and-wax-seal vocabulary from the original
  design handoff, kept consistent across SELF / SATCHEL / MEMOIR and
  modals (V3 consistency pass).

## Backgrounds: `ScreenBg`

`components/ScreenBg.tsx` is the one place a screen opts into a
backdrop plate. Two rules, deliberately separate knobs (see the
component's own comments — a prior critique pass caught two screens
dimming art two different ways):

1. **Dim, never blur** — the backdrop renders at `opacity: 0.2` so copy
   keeps contrast above it. The map (`MapCanvas`) set these numbers
   first; `ScreenBg` lifted them verbatim so the two surfaces don't
   drift.
2. **Vignette is a separate knob from the dim** — a thick inner border
   in `AXM.bg` keeps the plate from ending in a hard rectangle against
   panel chrome. Not a gradient — a border, so it costs nothing extra.

A screen with no `art` key keeps the flat `AXM.bg` ground it always
had — a dense table (inventory) is noise under a backdrop; opt-in, not
default.

## Iconography canon: `components/icons/`

One data-driven registry, one render path (`<AxmIcon name="..." />`),
shipped Phase V1. Geometry is curated from the owner-provided
game-icons.net library (`Potential Assets/icons-TBR`, CC BY 3.0 / CC0
per artist) through `scripts/extract-game-icons.mjs` into the generated
`game-icon-paths.ts` — **the app never reads the source library at
runtime**, and no component inlines a one-off `<Svg>` icon; every mark
goes through the registry so upgrading the art is a one-place change.

`ActionIcon` / `EffectGlyph` / the tab bar's `TabIcon` are thin adapters
over `AxmIcon` that keep their historical short keys (`'sword'`,
`'poison'`, …) mapped onto registry names (`action-sword`,
`effect-poison`). Callers never changed; only the art underneath did.

Registry coverage today: 11 `action-*` marks, 8 `effect-*` marks — see
`components/icons/icon-registry.ts` for the full list and each mark's
`<artist>/<icon>` attribution.

**Genuinely outstanding** (real gaps, not yet on the registry —
reconciled honestly in `SVG_ASSET_SPEC.md`'s checklist rather than
claimed done): `GlyphMind` (`components/StanceGlyph.tsx`) and the four
map node marker states (`components/NodeMark.tsx`) are still hand-coded
procedural SVG.

## Enemy art: the archetype figure system

`components/event/enemy-art/` resolves an enemy id to one of ten
drawing archetypes (`state/presenters/enemy-art.ts`
`resolveEnemyArchetype` — keyword-matched over the enemy id, with an
explicit override map for names that don't imply their shape):

```
vermin  crustacean  spirit  beast  avian
flora   zealot      eldritch  tyrant  generic
```

Every roster enemy has a bespoke 1:1 painting
(`assets/images/enemies/`, `assets/images/portraits/`) for its actual
in-fight art. The archetype figures (`components/event/enemy-art/figures.tsx`)
are the **silhouette fallback** — used by `EnemyPortrait` (the compact
in-combat HUD avatar) for any enemy, and by `EnemyIllustration` (the
full `CreatureScene` version) for synthetic/unauthored enemies and the
dev-only `/devart` gallery. As of Phase V8 both consumers share the
exact same figure set (`GenericFigure`, `TyrantFigure`, …) — the
pre-archetype placeholder scenes (`EncounterIllustration`,
`BossIllustration`) that predated this system and had drifted out of
sync with it are retired.

## Decorative procedural art

Not everything is acquired art, by design — `Splatter`
(`components/Splatter.tsx`, ink-splatter accent) renders one of four
acquired public-domain plates via `tintColor` (Phase V7); `TornPanel`'s
torn edge and the map's compass rose / hatch-and-vignette backdrop
(V2) stay procedural SVG because their job is infinite, seed-varied
texture, not a specific illustrated subject — acquiring "art" for a
seeded jagged-edge mask would be a category error.

## Working in this system — for the next screen or asset

1. **Color**: `AXM.*` tokens only, via `usePalette()`/`makeStyles()`.
   Never a hex literal in a component (a repo-wide hard rule, not just
   a style preference).
2. **Icons/glyphs**: check `components/icons/icon-registry.ts` first.
   If the mark exists, use `<AxmIcon name="..." />`. If it doesn't,
   extend the registry (`scripts/extract-game-icons.mjs`) rather than
   inlining a new `<Svg>` — the whole point of V1 was killing verbatim
   duplicates.
3. **Backgrounds**: opt into `ScreenBg`'s `art` prop only if the screen
   benefits from atmosphere over content (event/narrative screens, not
   dense data tables).
4. **New illustration**: follow `docs/asset-conventions.md`'s ingest
   contract (WebP, `assets/images/<category>/`, registry `require()`,
   `provenance.json` in the same commit). Check `SVG_ASSET_SPEC.md`
   first — the component you're about to draw a placeholder for may
   already have a resolved row.
5. **Headers**: reuse the ✠-eyebrow + hairline convention rather than
   inventing a new header treatment per screen.
