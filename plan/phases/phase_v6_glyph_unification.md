# Phase V6 — Combat & minigame glyph unification

> Woodcut Codex, V-series. Depends on V1 (shipped 2026-08-08). Brief
> generated 2026-08-30 by `/ship-a-phase` §9, after a full investigation
> pass (see "What exists, measured" — the row's own premise had drifted).

## Outcome

The one confirmed literal duplicate (hazard's hand-drawn chest vs. the
registry's `action-chest`) is folded into the registry. A dead orphan from
V1's own rollout (`EffectChip.tsx`, built and tested but never wired into
live combat) is torn down. `glyphShapes.ts` gets the dedicated test it never
had, and a keyword-mark canon audit pins that every registry keyword the
card-face FREE-glyph path can actually produce resolves to a real
silhouette — catching the one entry that had gone stale since Phase 29
(`BARRIER`, merged into `GUARD`, never removed).

The row's original ask — "audit `glyphShapes.ts` + `statusGlyphs.ts` ...
so every keyword renders one canonical mark" — is **not** fully closed.
Combat currently draws the same ~7 status concepts three different ways
(registry SVG, `statusGlyphs.ts` emoji, `glyphShapes.ts` card-face SVG).
Collapsing those into one visual language is a real design decision with
pinned-test and cross-component blast radius (see Follow-ups) — it is
scoped out of this tick and handed off with the full evidence trail so it
doesn't need re-deriving.

## What exists, measured

The build-plan row names four surfaces to fold: hazard, gathering, cache,
combat. Two no longer exist as glyph kits:

- **Gathering was fully retired** (Phase 76, `f18e6643`/`252b85e0`). No
  `app/gathering/`, no component, nothing to fold.
- **Cache ("The Reliquary", `app/cache/index.tsx`, Phase 63) is pure
  `<Text>`.** No `<Svg>`, no icon component. Nothing to fold.

Hazard (`components/hazard/glyphs.tsx`) and combat overlap in exactly one
place: `BoonIcon('chest')` hand-draws a chest path that duplicates the
registry's `action-chest` (curated in Phase V1, already wired through
`ActionIcon`/`NodeMark` elsewhere). Hazard's other marks (`DieGlyph`,
`ProgGlyph`, `LedgerMark`, the other `BoonIcon` cases, `danger-art.tsx`'s
vignettes) are bespoke minigame-only concepts with no registry equivalent —
per the masterplan's "deliberately-bespoke marks stay local," they stay.

The real fragmentation is **inside combat itself**: the same status
concepts (poison, bleed, burn, stun, regen, guard) are drawn three
independent ways —

1. `components/icons/` registry SVGs (`effect-poison`, `effect-bleed`, …),
   consumed only via `EffectGlyph`/`EffectChip` (singular) and the
   character sheet.
2. `components/combat/statusGlyphs.ts` — a curated Unicode-emoji table
   (`debuff_poison: '☠'`, …), the one actually rendered on the live combat
   board via `CombatCombatantPane`'s `EffectChips` (plural).
3. `components/combat/glyphShapes.ts` — hand-authored SVG silhouettes keyed
   by UPPERCASE keyword (`POISON: FLASK`, …), rendered on card faces via
   `CombatBoard`'s `CombatCardFace`.

`EffectChip.tsx` (singular, Phase 41) — the registry-backed status chip —
was never wired into the live board; `CombatCombatantPane.tsx` built its
own richer `EffectChips` (duration/intensity/isMax) on top of
`statusGlyphs.ts` instead. Zero non-test files import it. A genuine V1-era
orphan, per V1's own acceptance bar ("kill duplicates... delete or wire the
orphans").

`glyphShapes.ts`'s `GLYPH_SHAPES` table is reachable only through
`freeGlyphMeta`/`riderPairs` in `combat-encounter.engine.ts`: card-type
literals (OATH/HEX), a fixed set of currency-rider literals (GUARD, HEAL,
DRAW, …, all already registry keywords), or `keywordForEffect()` on an
effect id a live card can actually carry. Spec 32 v3's card-vocabulary ban
list (`Effects/e2e/deprecated-effects.engine.test.ts`) permanently retired
`debuff_stun`/`debuff_acid`/`debuff_frostbite`/`debuff_shock`/
`debuff_petrify` and dozens more from ever appearing on a card again —
but only `BARRIER` (superseded by the Phase 29 `keywords.ts` GUARD merge,
confirmed dead: `r.barrier` riders resolve straight to `'GUARD'`) had zero
ambiguity about being unreachable. The others carry weaker, inference-only
evidence (they might still serve a non-mobile consumer, e.g. the
card-editor's authoring preview) and are left alone rather than risk a
wrong removal.

`SVG_ASSET_SPEC.md` predates the registry entirely (still describes
`EffectGlyph.tsx` as a raw placeholder) and has no "keyword-mark canon"
section — its asset checklist is stale and belongs to V8 closure, not V6.

## Decisions made upfront — DO NOT ASK

- **Re-scope to the two live surfaces.** Gathering and cache are dropped
  from the fold — there is nothing there. Documented here so a future pass
  doesn't go looking for kits that no longer exist.
- **Fold only the confirmed duplicate.** `BoonIcon('chest')` → `AxmIcon
  name="action-chest"`. Every other hazard mark stays local — either
  genuinely bespoke (die faces, ledger verdicts, progress marks) or lacking
  a registry equivalent worth minting for a single consumer.
- **Delete the orphan, don't wire it.** `EffectChip.tsx` (singular) is
  superseded by `EffectChips` (plural, `CombatCombatantPane.tsx`) in every
  way that matters for the live board (duration, intensity, isMax). Wiring
  it in would be a regression, not a fix. Deleted with its test.
  `EffectGlyph.tsx` stays — it's live on the character sheet.
- **Remove only `BARRIER`, not the wider surrounding cast.** The evidence
  for `BARRIER` (an explicit, on-the-record Phase 29 merge plus a traced,
  confirmed-dead code path) is qualitatively stronger than the inference
  chain for `ACID`/`STUN`/`FROSTBITE`/etc. (retired from the card library,
  but not confirmed dead everywhere — e.g. the card-editor's own
  `freeKeyword` has already diverged from mobile on `barrier`→keyword
  mapping, which is its own bug, not this phase's to fix). Removing more
  than the one confirmed-dead entry risks a wrong deletion for a
  cosmetic-only cleanup; not worth it.
- **The three-runtime `GLYPH_SHAPES` sync (mobile / card-editor /
  `build-catalog.mjs`) is not touched.** `card-editor`'s `KwGlyph` is
  structurally different (a switch, not a keyed Record) and has already
  drifted from mobile on what `barrier` resolves to — editing it risks the
  live card-authoring tool for a glyph-audit phase. Filed as a Follow-up.
- **The full registry/emoji/SVG merge is a Follow-up, not this tick.**
  `statusGlyphs.test.ts` pins exact emoji per effect id; merging visual
  languages means deliberately rewriting those pins plus touching render
  call sites in `CombatCombatantPane`, `EnemyActionCard`, `IntentIcon`, and
  `CombatBoard`. That's a real design call (which visual language wins per
  concept) better made with the concrete surface matrix below in hand, not
  guessed at inside an autonomous tick.

## Surface

| File | Change |
|---|---|
| `components/hazard/glyphs.tsx` | `BoonIcon('chest')` renders `<AxmIcon name="action-chest">` instead of a hand-drawn path |
| `components/combat/glyphShapes.ts` | `BARRIER` entry removed (dead since Phase 29); doc comment updated |
| `components/combat/__tests__/glyphShapes.test.ts` | new — hygiene + keyword-canon audit (didn't exist before) |
| `components/EffectChip.tsx` | deleted (orphan, zero live consumers) |
| `components/__tests__/EffectChip.test.tsx` | deleted (tested only the orphan) |

## Tests

| Case | Assert |
|---|---|
| `glyphShapes.test.ts` — hygiene | every `GLYPH_SHAPES` entry has a non-empty `d` path |
| `glyphShapes.test.ts` — `glyphShapeFor` | case-insensitive, null-safe, unknown key → `null` |
| `glyphShapes.test.ts` — canon audit | `BARRIER` → `null`; every effect-backed registry keyword (Poison/Bleed/Mark/Backfire/Quarter/Thorns/Doom) → a real shape |
| `components/hazard/__tests__/glyphs.test.tsx` | unchanged, still green — pins `BoonIcon`'s render contract, not its internals |

## Verify gate

`npm run verify` (axiomancer-mobile).

## DoD

- [x] Hazard/registry chest duplicate folded.
- [x] `EffectChip.tsx` orphan deleted.
- [x] `glyphShapes.ts` dead `BARRIER` entry removed + regression-tested.
- [x] Dedicated `glyphShapes.test.ts` exists (previously had none).
- [ ] "Every keyword renders one canonical mark" (full registry/emoji/SVG
      merge) — Follow-up, not this tick.

## Follow-ups (out of scope)

- **The full visual-language merge.** Concrete matrix (surface × concept):
  Poison/Bleed/Burn/Stun/Regen/Guard each have a registry SVG, a
  `statusGlyphs.ts` emoji, and a `glyphShapes.ts` card-face SVG — three
  independent implementations of the same idea. Picking one canonical mark
  per concept needs a design call (which language wins: emoji legibility
  at small board size, vs. SVG consistency with the woodcut direction) and
  touches pinned tests (`statusGlyphs.test.ts`) plus four render call
  sites. A future V6-follow-up or `/oversight` session can start directly
  from this brief's surface table instead of re-deriving it.
- **The triplicated `GLYPH_SHAPES` table** (`axiomancer-mobile`,
  `axiomancer-card-editor`'s `KwGlyph`, root `scripts/build-catalog.mjs`).
  Extracting a shared source is a cross-package refactor touching three
  independent build/verify pipelines — bigger than a glyph-audit phase.
- **`card-editor`'s `freeKeyword` vs. mobile's `freeGlyphMeta` divergence
  on `barrier`.** `card-editor` still resolves a `barrier` free-rider to
  the keyword `'barrier'`; mobile resolves it to `'GUARD'` (Phase 29). A
  real, small bug in the authoring tool — worth its own ticket, not
  bundled into a glyph-registry phase.
- **`SVG_ASSET_SPEC.md` reconciliation** (stale checklist, pre-registry
  component descriptions) — explicitly V8 closure's job.
- **`BodyDiagram`/`MindMark`/`FriendshipMeter` orphans** (flagged in the
  build plan's V1 carry-over note) — component orphans unrelated to the
  glyph-kit/keyword-registry scope of this row; V8 closure's placeholder
  teardown is the better fit.
