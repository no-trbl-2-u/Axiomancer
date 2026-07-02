# Phase 51 — Autosave throttling per Spec 09 Q4

> Promoted via `/oversight` 2026-05-19 (`b0e4546`). Brief authored
> 2026-05-19 at commit `7087c98`.

## Source

- `plan/PHASE_CANDIDATES.md` Promoted entry "Phase 51 — Autosave throttling".
- Spec 09 Q4 ("How brutal should the autosave cadence be? Throttle, restrict-by-action-type, or leave on every action?").
- Standing TODOs: `src/Game/store.ts:213-216` and `src/Game/game.reducer.ts:138-141`.

## Goal — one-line outcome

Restrict autosave to a curated set of durable actions; UI-tier actions stop writing through `adapter.save`. Drains the two `TODO(spec-09)` markers and closes Spec 09 Q4 with path (B).

## Decisions (made upfront)

### D1 — Restrict by action type (path B), not by debounce (path A)

Picked path (B) restrict-by-action-type per the candidate scope and the user's `/oversight` Q2 choice on 2026-05-19. The curated durable set: `COMBAT_ROUND`, `LEVEL_UP`, `END_COMBAT`, `MOVE_TO_NODE`, `APPLY_DIALOGUE`, `SAVE_GAME`. Debounce (path A) would add a timing dependency that hermetic tests would need to drive with fake timers — restrict-by-action-type is purely structural, easier to pin in e2e, and matches React Native AsyncStorage's "batch by transition" mental model.

### D2 — `updateCombat()` keeps autosaving

`updateCombat()` bypasses `dispatch` (it's called by the CLI combat loop after `resolveCombatRound` runs), but it's semantically a COMBAT_ROUND-equivalent state transition. Keep its existing `adapter.save` call. The DURABLE_ACTIONS set is consulted inside `dispatch` only.

### D3 — `save()` verb keeps writing unconditionally

The store's `save()` verb is an explicit user save (it emits `game:saved`). It is not gated by the durable-actions set — calling `save()` always writes. The `SAVE_GAME` action that goes through `dispatch` is also in the durable set; both paths still write.

### D4 — Non-durable actions: scope and rationale

Excluded from the durable set: `START_COMBAT`, `PROCESS_NODE`, `USE_ITEM`, `EQUIP_ITEM`, `UNEQUIP_ITEM`, `ALLOCATE_STAT_POINT`, `LEARN_SKILL`, `SHIFT_MORAL_METER`, `SHIFT_PHILOSOPHICAL_ALIGNMENT`, `LOAD_GAME`.

Notable choices in this list:
- `LEARN_SKILL` / `ALLOCATE_STAT_POINT` / `EQUIP_ITEM` are persistent character changes — they will save on the *next* durable transition (COMBAT_ROUND, LEVEL_UP, MOVE_TO_NODE) or whenever the player triggers `SAVE_GAME` explicitly. The few-actions delay is intentional per Spec 09 Q4: the autosave is a backstop, not a transaction log.
- `LOAD_GAME` writing back would be a footgun — load round-trips through `migrate` and re-emits, but writing the loaded payload back is a no-op at best and a corruption risk if `migrate` upgraded the schema mid-flight.

## Commit units

### Unit 1 — Add DURABLE_ACTIONS set + gate `dispatch`-side autosave

Files:
- `src/Game/store.ts` — declare a `DURABLE_ACTIONS: ReadonlySet<GameAction['type']>` and gate the `adapter.save(...)` call inside `dispatch` behind it. Remove the `TODO(spec-09)` comment block at `:213-216`.
- `src/Game/game.reducer.ts` — remove the `TODO(spec-09)` comment block at `:138-141` (the throttling now lives in `store.ts`; the reducer-side note is stale).

Hermetic test:
- `src/Game/e2e/autosave-throttling.engine.test.ts` — new. Drives a store with a save-counting adapter through: START_COMBAT (no save), COMBAT_ROUND (save), USE_ITEM (no save), MOVE_TO_NODE (save), ALLOCATE_STAT_POINT (no save), SAVE_GAME (save), LEARN_SKILL (no save), LEVEL_UP (save), SHIFT_MORAL_METER (no save), END_COMBAT (save when applicable). Assert the exact `save` call count.

Commit: `feat(game): Phase 51 — autosave throttling via DURABLE_ACTIONS allowlist`.

## Verify gate

`npm run verify` + `npm run deploy:check` — green.

## DoD

- Phase 51 row in `plan/steps/01_build_plan.md` flips `[ ]` → `[x]`.
- Both `TODO(spec-09)` markers gone.
- Hermetic e2e pins the save-count per action type.
- Spec 09 Q4 acceptance line gains a "DONE at Phase 51" reference.

## Out of scope

- Debounce-based throttling (path A) — rejected via D1; can be added later if the action-type filter proves insufficient.
- AsyncStorage-side write batching — that's mobile-repo work; this phase only ships the upstream policy.
