# axiomancer-mechanics: 0.7.0 → 0.10.0 upgrade guide for mobile

> Drafted from the engine side. Covers what changed in the engine
> between `axiomancer-mechanics@0.7.0` (mobile's current pin) and
> `axiomancer-mechanics@0.10.0` (latest tag), and what mobile must / may
> do to consume the bump.
>
> The bump crosses Phases 38 → 49. Most changes are **backwards-compatible
> additions**; one type was removed; persisted state grows a new field
> that needs a migration.

---

## TL;DR

| Item | Action | Severity |
|---|---|---|
| Bump `package.json` pin from `0.7.0` → `0.10.0` | required | trivial |
| Persisted `GameState` gains `alignment` field (Phase 42) | add migration `v2 → v3` | **required** |
| `WorldMap` type removed from `axiomancer-mechanics` exports | mobile doesn't import it — no-op (grepped) | breaking-but-clear |
| `executeSkill` signature gained optional `casterSide` (defaults to `'player'`) | no-op for mobile (no direct call sites) | additive |
| `applyEffect` options gained optional `sourceId` | no-op for mobile (no direct call sites) | additive |
| New `Philosophy` module (alignment cube + 27-cell registry) | optional adopt for UI | additive |
| New `buyItem` / `sellItem` reducers + `ShopWare` / `ShopInventory` types | optional adopt for shop screen | additive |
| New `unlockAdjacent` world reducer | optional adopt | additive |
| New `selectCritDamage` Combat helper | optional adopt | additive |
| `skillLibrary` / `getSkillById` top-level re-export | **still missing** — Phase 50 promoted, not yet shipped. Keep the stop-gap in `state/mocks/combat.skills.fixture.ts` | unblocked-pending |
| `dist/<subpath>/types.d.ts` emission | **still broken** — Phase 50 promoted, not yet shipped. Keep current local type re-declarations | unblocked-pending |
| `getCoastalMap` barrel export | still present in 0.10.0 (removal authorized but not shipped). Mobile call sites in `state/actions.ts:29,759` + `state/e2e/exploration.engine.test.ts` keep working | no-op |

**Net effect:** mobile can lift the pin to `0.10.0` with **one required migration** (alignment field) and zero forced call-site rewrites. The Phase 50 republish (engine handoff) will unblock the two remaining gaps.

---

## 1. Required: schema migration for the new `alignment` field

**What changed (engine):** Phase 42 (commit `05c4f42`) added a 3-axis philosophical alignment cube to `GameState`. The field is `state.alignment: PhilosophicalAlignment` and lives at the top level alongside `character` / `world` / `combatResources`.

**Engine shape (from `src/Philosophy/types.d.ts`):**

```ts
type AxisBucket = 'low' | 'mid' | 'high';

interface PhilosophicalAlignment {
    epistemic: number;     // -100..+100
    ethical: number;       // -100..+100
    metaphysical: number;  // -100..+100
}
```

**Default (engine):** `defaultAlignment()` returns `{ epistemic: 0, ethical: 0, metaphysical: 0 }`. Mobile's migration should write the same defaults so the cell resolves to `(mid, mid, mid)` — the neutral starting cube cell.

**Migration (mobile):**

In `state/persistence/migrations.ts`:

```ts
// Bump
export const CURRENT_SCHEMA_VERSION = 3;

// Add migration v2 → v3
migrations[2] = (state: any) => ({
    ...state,
    alignment: state.alignment ?? {
        epistemic: 0,
        ethical: 0,
        metaphysical: 0,
    },
});
```

**Why it's required, not optional:** the engine's `createNewGameState` writes `alignment` on every fresh save; the alignment-aware reducers (Phase 43-46) read it. A `0.7.0`-era save loaded into a `0.10.0` engine without the migration will throw the first time a dialogue choice or map event with an `alignmentDelta` resolves.

**Test:** `state/persistence/e2e/asyncStorageAdapter.engine.test.ts` should gain a case that loads a `schemaVersion: 2` envelope and asserts the result's `alignment` equals `defaultAlignment()`.

---

## 2. Breaking: `WorldMap` type removed from public API

**What changed (engine):** Commit `a707316` dropped the deprecated `WorldMap` barrel alias. The replacement (`MapDefinition` + `MapState`) has been the canonical pattern since Phase 23.

**Mobile impact:** grepped — **no mobile call sites import `WorldMap`**. No-op.

**Future-proofing:** if a contributor adds a `WorldMap` import, the build will fail. Document the replacement in `docs/state.md` to head this off:
- `MapDefinition` — the static structure of a map (nodes, edges, encounters).
- `MapState` — the player's progress through a `MapDefinition` (visited nodes, current node, completed flags).

---

## 3. Optional but recommended adoptions

### 3a. Drop the `skillLibrary` stop-gap **iff** Phase 50 lands before the bump

`state/mocks/combat.skills.fixture.ts` re-declares `skillLibrary` because `axiomancer-mechanics@0.7.0` doesn't re-export it from the top-level barrel.

**Status at 0.10.0:** still missing (`src/index.ts:117-128` exports the Skills *functions* but not `skillLibrary` / `getSkillById`). Tracked by **Phase 50** in the engine plan — promoted via `/oversight` on 2026-05-19 but **not yet shipped**.

**Mobile action:**
- If bumping to `0.10.0` **today**: keep the stop-gap as-is, and the import comments at `state/actions.ts:13-14` + `state/mocks/tokens.fixture.ts:5,49` + `state/mocks/combat.skills.fixture.ts:6,33` stay accurate.
- If the engine ships a `0.10.1` / `0.11.0` with the re-export before the mobile bump lands: delete the stop-gap and replace with `import { skillLibrary, getSkillById } from 'axiomancer-mechanics'`. Sanity check: `node -e "const m = require('axiomancer-mechanics'); console.log(typeof m.skillLibrary, typeof m.getSkillById)"` should print `object function`.

### 3b. New Philosophy surface (Phase 42-46) — UI opportunity

The engine now exposes a fully-populated alignment cube. Mobile can choose to surface it (a UI badge on the character screen, an alignment-shift toast on dialogue, a filter on the skill list, etc.) or ignore it for now (the engine will keep `alignment` up to date silently as the player plays).

**Exports mobile may import once bumped:**

```ts
import {
    bucketAxis, getAlignmentCell, applyAlignmentDelta, defaultAlignment,
    AXIS_HIGH_THRESHOLD, AXIS_LOW_THRESHOLD,
    philosophicalAlignmentLibrary,
} from 'axiomancer-mechanics';

import type {
    AxisBucket, PhilosophicalAlignment, AlignmentFallacy,
    PhilosophicalAlignmentCell,
} from 'axiomancer-mechanics';
```

**Key behaviors:**
- `bucketAxis(value)` → `'low' | 'mid' | 'high'` (thresholds at ±33).
- `getAlignmentCell(alignment)` → the current `PhilosophicalAlignmentCell` from the 27-cell library (name, description, fallacies, virtues).
- `applyAlignmentDelta(state, delta)` is a **pure reducer**; never mutate `state.alignment` directly.
- Dialogue choices and map-event payloads can carry an `alignmentDelta` field (Phase 43); the engine threads it automatically when the player picks them. Mobile only needs to render it if it wants to preview the shift before commit.

### 3c. Shop screen — `buyItem` / `sellItem`

Phase 37 added a real shop. Engine now exports:

```ts
import { buyItem, sellItem } from 'axiomancer-mechanics';
import type { ShopWare, ShopInventory } from 'axiomancer-mechanics';
```

`ShopInventory` is a typed list of `ShopWare` (item ref + price + stock). The reducers handle gold debit/credit, inventory transfer, and stock decrement. If mobile has a shop screen on the roadmap, this replaces any locally-written shop logic.

### 3d. Other small additions

| Symbol | Module | What it gives you |
|---|---|---|
| `unlockAdjacent` | World reducer | Reveal-and-unlock in one call (vs `revealAdjacent` + per-node `unlockNode`). |
| `selectCritDamage` | Combat | Pure crit-damage selector — useful for damage-preview UI. |
| `AlignmentGate` | NPCs | Type for `requiresAlignment` on dialogue choices. Mobile UI may want to render gated choices as visible-but-disabled with a reason tooltip. |
| `ActiveEffect.sourceId` | Effects | Existing effects now carry a stable `sourceId` (last-writer-wins on stack). Useful if the HUD wants to show "this poison came from the rusty dagger". |
| 4 new fallacy Tier 3 skills | Skills library | `straw-man`, `ad-hominem`, `false-dichotomy`, `slippery-slope` — auto-available via `skillLibrary` once the re-export ships. |

---

## 4. State-shape changes between 0.7.0 and 0.10.0

These are additive on `GameState` unless noted:

| Field | Added in | Required migration? |
|---|---|---|
| `state.alignment: PhilosophicalAlignment` | Phase 42 | **yes** (see §1) |
| `state.world.mapState.nodes[].alignmentDelta?` payload | Phase 43 | no (optional + defaults to undefined → zero shift) |
| Dialogue `DialogueChoice.alignmentDelta?` | Phase 43 | no (optional) |
| Dialogue `DialogueChoice.requiresAlignment?: AlignmentGate` | Phase 46 | no (optional; engine treats undefined as "no gate") |
| Skill `Skill.requiresAlignment?: AlignmentGate` learning requirement | Phase 46 | no (optional) |
| `Enemy.philosophicalAlignment?` + `Enemy.outlook?` bias | Phase 45 | no (optional; library backfills the canon enemies) |
| `Effects.applyEffectOptions.sourceId?` | Phase 38 | no (optional input, not a state shape change; the field appears on stored `ActiveEffect` only when set, so old saves render as `undefined` and behave identically) |

**The only migration mobile must write is the v2 → v3 default for `state.alignment`.**

---

## 5. The remaining engine gaps (not blockers, but worth tracking)

Both are on the engine's Phase 50 brief (promoted via `/oversight` on 2026-05-19, not yet shipped):

1. **Top-level re-export of `skillLibrary` / `getSkillById`.** Mobile keeps the local stop-gap until Phase 50 ships. See §3a.
2. **`dist/<subpath>/types.d.ts` emission broken in 8 of 9 sub-paths.** Engine sub-path imports (e.g. `import type { Skill } from 'axiomancer-mechanics/Skills'`) still don't work because the `.d.ts` isn't emitted. Mobile imports everything from the top-level barrel `'axiomancer-mechanics'`, so this doesn't hurt mobile in practice — but the local type re-declarations in `state/mocks/*` should stay until Phase 50 ships and a `0.10.1` republish lands.

After Phase 50 + republish, file a small mobile follow-up to delete the stop-gaps. That work is **out of scope for this upgrade**.

---

## 6. Suggested mobile upgrade sequence

1. **Branch from `main`.** Name it `engine/bump-0.10.0`.
2. **Bump the pin.** `package.json:37` `"axiomancer-mechanics": "0.10.0"`. Run `npm install`.
3. **Run the suite once and triage breakage.** Expect: zero TypeScript errors (no removed surface that mobile uses), and one runtime test failure in the persistence suite if a legacy `schemaVersion: 2` envelope is loaded.
4. **Write the v2 → v3 migration** (see §1). Add an `asyncStorageAdapter.engine.test.ts` case that loads a v2 envelope and asserts `alignment` defaults.
5. **Re-run the full suite.** All green.
6. **(Optional) Light-touch Philosophy adoption** — render the alignment cell name somewhere visible on the character screen so the upgrade is observable to the player. The engine is already updating `state.alignment` whether or not the UI shows it.
7. **Ship.**

Estimated effort: **half a day** for the required bits, plus whatever optional UI work mobile chooses to scope in.

---

## 7. Cross-reference

- Engine plan: `axiomancer-mechanics/plan/steps/01_build_plan.md` — phases 38 through 49 shipped; Phase 50 (engine handoff) and Phase 51 (autosave throttling) pending.
- Engine handoff (predecessor doc): `axiomancer-mobile/docs/engine-team-handoff-2026-05-16.md`.
- Engine API docs touched by the bump: `docs/character.md`, `docs/combat.md`, `docs/effects.md`, `docs/enemy.md`, `docs/items.md`, `docs/skills.md`, `docs/world.md`, `docs/philosophy.md` (new), `docs/morality.md`.
- GH#64 is the canonical engine-side tracking issue for the Phase 50 gaps; #61 / #62 / #63 closed as duplicates.
