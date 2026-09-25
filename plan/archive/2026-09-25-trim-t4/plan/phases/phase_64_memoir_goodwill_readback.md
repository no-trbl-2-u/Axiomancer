# Phase 64 — The journal reads the goodwill back

## Outcome

Phase 63's `GameState.mapGoodwill: Record<string, number>` (written only by the
loot-cache sacrifice offer) gets its first reader: the memoir tab's existing
REMAINS section grows a new GOODWILL sub-group, rendering one line per helped
map — `"Helped <map> N times."` — mirroring the KEEPSAKES sub-group's shape
exactly (eyebrow + list + empty state). No new state, no new route: this is a
pure read-back phase.

## Problem (from `01_build_plan.md`)

Phase 64 row: *"Render Phase 63's per-map counter as 'Helped `<map>` N times'
on the memoir tab (`axiomancer-mobile/app/(tabs)/memoir/index.tsx`), which
already exists and already reads keepsake flags. Small, but it is the half
that makes the sacrifice legible — a counter the player cannot see is not a
choice, it is a silent tax. Deps: 63."*

## Scope

Mobile only (`axiomancer-mobile`). Presenter + screen + tests. No mechanics
changes — `GameState.mapGoodwill` already shipped in Phase 63.

### `state/presenters/memoir.engine.ts`

- New pure helper `buildGoodwill(rawMapGoodwill: unknown): ReadonlyArray<string>`:
  - Defensive input handling matching this file's existing style (`typeof
    === 'object'`, per-entry `typeof === 'number'`) — mirrors
    `extractKeepsakes`'s defensive-parsing convention.
  - Filters to `count > 0` (defensive; the engine only ever writes positive
    increments, but a map with `0` should never render — "never a flag, it
    counts" per Phase 63's design intent, and a zero-entry is indistinguishable
    from "never helped").
  - Sorts **descending by count, tie-broken ascending by raw map-name key**
    (`b[1] - a[1] || a[0].localeCompare(b[0])`) — most-helped map leads, and
    the tie-break keeps output deterministic for tests/snapshots without
    inventing a narrative ordering the design doesn't ask for.
  - Resolves each map's display label via `getMapLayout(mapName)?.region ??
    mapName` (new import: `import { getMapLayout } from
    '@/state/exploration-maps'`, same helper `exploration.engine.ts` already
    uses for the on-screen region name — `fishing-village` → `"the Drowned
    Parish"`, `northern-forest` → `"Northern Forest"`). Maps without an
    authored layout (none exist as playable content today, but the union type
    covers unbuilt labyrinth/northern-continent maps) fall back to the raw
    key so the line never goes blank.
  - Emits `"Helped <label> once."` for count `1`, `"Helped <label> <N>
    times."` otherwise — same singular/plural split as `buildDeathLine` /
    `buildSoulsLine`, capitalized "Helped" matching T's literal framing quote
    (the other REMAINS lines are lowercase-led; this one intentionally isn't,
    since it's quoting the design ask verbatim rather than inventing new
    prose register).
- `buildRemains` gains a third parameter `rawMapGoodwill: unknown`, threaded
  through to `buildGoodwill`; `MemoirRemainsViewModel` gains `goodwill:
  readonly string[]`; `DEFAULT_REMAINS.goodwill` defaults to `[]`.
- `selectMemoirViewModel` passes `state.mapGoodwill` as the new third arg:
  `buildRemains(state.flags, player?.bankedSouls, state.mapGoodwill)`.
- `MemoirViewModel` gains `remainsGoodwillEyebrow: string` and
  `emptyGoodwill: string`; `FALLBACK_VM` pins `remainsGoodwillEyebrow: '✠
  GOODWILL'` and `emptyGoodwill: 'nothing given.'` (parallels
  `emptyKeepsakes: 'nothing kept.'` — sacrifice is the mirror-image verb of
  keeping).

### `app/(tabs)/memoir/index.tsx`

Inside the existing `memoir-remains` section, after the KEEPSAKES
`questGroup` block, add a sibling `questGroup` block for GOODWILL — identical
shape to the keepsakes block (`SectionLabel` eyebrow, empty-state `Text` with
`testID="memoir-goodwill-empty"` when `vm.remains.goodwill.length === 0`,
else one `Text` per line with `testID={`memoir-goodwill-${index}`}` and the
existing `styles.keepsakeLine` style — no new stylesheet entries needed, the
line register is identical to a keepsake line).

## Content / data reads

| Helper | Call | Use |
|---|---|---|
| `getMapLayout` (`@/state/exploration-maps`, existing) | `getMapLayout(mapName)?.region` | Resolve a map key to its display label for the goodwill line |
| `buildGoodwill` (new, this file) | `buildGoodwill(state.mapGoodwill)` | Compose the sorted, formatted goodwill line list |

No new engine reads — `state.mapGoodwill` is already a `GameStore` field
(Phase 63); the presenter reads it the same way it already reads `state.flags`
and `player.bankedSouls`.

## Components / handlers

No new components. Reuses `SectionLabel`, `Text`/`View` primitives, and the
existing `styles.questGroup` / `styles.emptyLine` / `styles.keepsakeLine`
style objects already defined in `memoir/index.tsx`.

## Cross-links

- **In:** none — GOODWILL is a passive read-back sub-section of an
  already-linked tab, not a new destination.
- **Out:** none — no navigation added.
- **Retro-fit:** none required. Phase 63's sacrifice claim path
  (`claimLootCacheChoiceOutcomeAction`) already writes `mapGoodwill`; this
  phase only adds a reader.

## Output schema / contracts

```ts
export interface MemoirRemainsViewModel {
    // ...existing fields unchanged...
    /** Phase 64 — formatted "Helped <map> N times." lines, descending by
     *  count then ascending by map key, from `GameState.mapGoodwill`. */
    goodwill: readonly string[];
}

export interface MemoirViewModel {
    // ...existing fields unchanged...
    remainsGoodwillEyebrow: string;
    /** Shown when `remains.goodwill` is empty. */
    emptyGoodwill: string;
}
```

Additive-only — no existing field renamed or removed; `state/e2e/memoir.engine.test.ts`'s
existing assertions on `vm.remains.*` keep passing unchanged.

## Decisions made upfront — DO NOT ASK

1. **GOODWILL lives inside the existing REMAINS section**, as a third
   `questGroup` sibling to KEEPSAKES, not a new top-level section. The build
   plan row explicitly frames this as extending the tab that "already reads
   keepsake flags" — same register (a passive tally read-back), same visual
   weight.
2. **Sort: count descending, map-key ascending tie-break.** No narrative
   ordering (e.g. "order first helped") is specified anywhere, and the
   engine's `Record<string, number>` carries no timestamp to derive one from.
   Count-descending is the most legible default — the village you've helped
   most leads.
3. **Zero-count entries never render**, even though the current writer
   (`claimLootCacheChoiceOutcomeAction`) can only ever write positive
   increments today. Defensive per this presenter's established style
   (`extractKeepsakes`, `buildRemains` all defend against inputs the current
   writers wouldn't produce).
4. **Display label via `getMapLayout(...)?.region`, raw key fallback.** Reuses
   the exact helper `exploration.engine.ts` already uses for the same
   purpose; no new lookup table. Maps without an authored layout (there are
   none live today) degrade to their raw kebab-case key rather than a blank
   or placeholder string.
5. **"Helped" capitalized, unlike the rest of REMAINS' lowercase-led lines.**
   T's build-plan framing quotes the exact copy `"Helped <map> N times"`;
   honoring that literal quote outweighs matching `buildDeathLine`'s
   lowercase convention for a brand-new line with its own quoted source.
6. **No new testIDs beyond `memoir-goodwill-empty` / `memoir-goodwill-<i>`.**
   Mirrors `memoir-keepsakes-empty` / `memoir-keepsake-<i>` exactly (index
   suffix, not map-name suffix, since map keys aren't guaranteed valid
   testID characters and the index is already how keepsakes key their rows).

## Empty / loading / error states

- Zero maps helped (fresh game, or a game where sacrifice was never chosen):
  `emptyGoodwill` — `"nothing given."` — renders in place of the list, exactly
  parallel to `emptyKeepsakes`'s `"nothing kept."` empty line.
- No loading state — `mapGoodwill` is synchronous engine state, same as every
  other REMAINS field.

## Mobile reflow / responsive / paginate / output limits

None — reuses the existing `ScrollView` + `keepsakeLine` text style, which
already handles arbitrarily many keepsake rows at 375px. No cap needed today
(at most one line per map in the game, and the game ships two playable maps).

## Pages × tests matrix

| Surface | Test |
|---|---|
| `buildGoodwill` / `buildRemains` goodwill field — empty default | `axiomancer-mobile/state/e2e/memoir.engine.test.ts` (extended) |
| Singular ("once.") vs plural ("N times.") line formatting | same file |
| Multi-map sort: count descending, key-ascending tie-break | same file |
| Display label resolves via `getMapLayout(...).region` | same file |
| Unknown/unlayouted map key falls back to the raw key | same file |
| Zero-count entries filtered out defensively | same file |
| `remains.goodwill` is part of the frozen view model | same file |

No new screen-level test file — `memoir/index.tsx` has no dedicated component
test today (engine-level coverage is the established pattern for this
screen); the new JSX block reuses already-covered style/testID conventions.

## Verify gate

`npm run verify --workspace axiomancer-mobile`.

## Commit body template

```
feat(mobile): memoir reads the goodwill tally back — phase 64

- new REMAINS sub-group "GOODWILL": one "Helped <map> N times." line per
  map with a positive GameState.mapGoodwill entry
- buildGoodwill sorts count-descending, map-key-ascending tie-break;
  resolves display labels via the existing getMapLayout(...).region helper
- additive MemoirViewModel/MemoirRemainsViewModel fields; existing memoir
  VM contract untouched

Decisions:
- GOODWILL nests inside REMAINS as a third sub-group (sibling to
  KEEPSAKES), not a new top-level section — same passive-tally register
- "Helped" stays capitalized, quoting T's literal build-plan framing,
  unlike the rest of REMAINS' lowercase-led narrative lines

Closes #<phase-issue-number>
```

## DoD

- [ ] `memoir.engine.ts` exports the extended `MemoirRemainsViewModel` /
      `MemoirViewModel` shapes; `buildGoodwill` covers empty / singular /
      plural / multi-map-sort / unknown-map-fallback / zero-filter cases.
- [ ] `memoir/index.tsx` renders the GOODWILL sub-group with the specified
      testIDs, reusing existing styles.
- [ ] `npm run verify --workspace axiomancer-mobile` green.

## Follow-ups (out of scope)

- Phase 65 — village goodwill rewards (discounts, ally-card grant, etc.)
  spend against the counter this phase only reads passively.
