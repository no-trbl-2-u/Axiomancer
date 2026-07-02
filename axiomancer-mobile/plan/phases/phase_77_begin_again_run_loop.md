# Phase 77 — BEGIN AGAIN run-loop consumer

> Promoted via /oversight 2026-05-23 (36th call) from
> `PHASE_CANDIDATES.md` `[score 4.5]` row. Engine 0.11.0
> Phase 72 [ENGINE LANDED] surfaced a `resetRun({ keepCharacter })`
> primitive on the GameStore (`RESET_RUN` action). This phase
> rewires `<CombatDefeatPanel>`'s BEGIN AGAIN button to use it,
> retiring the mobile-side band-aid.

## 1. Why

`components/event/EncounterModalOverlay.tsx::handleBeginAgain`
(Phase 70 Tick C) currently fakes a run restart with a
`store.setState({ player: { health: maxHealth } })` patch
plus the mobile-only `resetRunStats()` shim. The patch:

- Does NOT reset the engine `runId` (carries over across
  "new runs").
- Does NOT clear the player's active effects.
- Does NOT regenerate the world / quests / flags.
- Was explicitly labelled a placeholder in the Tick C commit
  body: "Engine-level new game / fresh-seed restart is a
  follow-up; this is the minimum meaningful start-over hook."

The engine's `resetRun({ keepCharacter: true })` does all of
the above atomically. We swap the band-aid for the engine
call.

## 2. Scope (single tick)

### A. Add `actions.resetRun` to the mobile action layer

`state/actions.ts`:

- Add `resetRun: (opts: { keepCharacter: boolean }) => void`
  to the `AppActions` interface (after `allocateStatPoint`,
  alongside the other engine-passthrough wrappers).
- Implement as a thin forward to `store.getState().resetRun(opts)`
  — the engine GameStore exposes it directly on
  `GameStore = GameState & GameActions`. The wrapper takes
  the same shape as `allocateStatPoint`'s cast pattern; no
  return-value plumbing needed (the engine returns the
  fresh state but the store is already updated atomically).

### B. Rewire `EncounterModalOverlay.handleBeginAgain`

`components/event/EncounterModalOverlay.tsx`:

- Drop the `store.setState({ player: ... })` band-aid.
- Replace with `actions.resetRun({ keepCharacter: true })`.
- Keep the `resetRunStats()` call alongside — `encountersFaced`
  and `deepestNodeId` live on the mobile `combat-mode` provider
  (engine doesn't track them yet), so they still need an
  explicit reset.
- Keep the `dismissAftermath()` call alongside — it tears
  down the modal session; engine reset doesn't know about
  modal lifecycle.
- Source the actions handle via `useGameActions()` (the
  hook already used elsewhere in the file is implicit via
  the store; we add an explicit `useGameActions()` import).

### C. Tests

`components/event/__tests__/EncounterModalOverlay.test.tsx`
or a new dedicated test:

- After tapping BEGIN AGAIN on the defeat panel, assert:
  - The engine `runId` changed (`store.getState().runId !==
    prevRunId`).
  - The player health is full (`hp === maxHp`).
  - The player effects are empty (`effects.length === 0`).
  - The mobile `encountersFaced` counter dropped to 0.
  - The modal aftermath was dismissed
    (`aftermathData === null`).

`state/e2e/actions.engine.test.ts` (or wherever the action
wrappers are pinned): add a small pin that
`actions.resetRun({ keepCharacter: true })` produces a fresh
runId and clears combat state.

## 3. Decisions made upfront — DO NOT ASK

1. **`keepCharacter: true` is the only BEGIN AGAIN
   semantics.** The button means "restart the run with this
   character." A second BEGIN AGAIN variant for fresh-character
   ("new game") is a separate phase and not surfaced from
   the defeat panel.
2. **Mobile `resetRunStats()` stays.** `encountersFaced` and
   `deepestNodeId` are mobile-only (engine has no run-summary
   counters today). Folding them into the engine would
   require an engine bump and content surface — out of scope
   for a run-loop consumer phase.
3. **No reset of `combat-mode` `lastOutcome`.** The
   `dismissAftermath()` call already clears `lastOutcome` +
   `aftermathData` + `inEncounterModal` atomically. No
   double-clear.
4. **The action wrapper does NOT return the fresh state.**
   `allocateStatPoint` returns post-state for the UI; reset
   has no per-call UI affordance (the screen re-renders from
   the new store state).
5. **No engine bump.** `resetRun` already landed in 0.11.0
   on the lockfile.
6. **No router navigation in `handleBeginAgain`.** The
   modal closes via `dismissAftermath()`; exploration
   re-mounts on the fresh world. The old patch did the
   same — preserves continuity.
7. **No combat-modal layout change.** Honours the 36th
   /oversight call's combat-modal-audit bias.

## 4. Acceptance (DoD)

- `pnpm verify` green.
- BEGIN AGAIN dispatches `resetRun({ keepCharacter: true })`
  through the engine; `runId` updates, player health refills,
  effects clear, world regenerates.
- Mobile `encountersFaced` / `deepestNodeId` reset alongside.
- Modal closes via the existing `dismissAftermath()` path.
- No remaining `store.setState({ player: ... })` band-aid in
  `EncounterModalOverlay.tsx`.

## 5. Commit body template

```
feat: BEGIN AGAIN engine run-reset consumer — phase 77

- EncounterModalOverlay.handleBeginAgain now dispatches
  actions.resetRun({ keepCharacter: true }) instead of the
  Phase 70 Tick C band-aid (raw setState health-patch +
  resetRunStats shim).
- Engine resetRun atomically: regenerates runId, full-heals
  the player, clears active effects, regenerates world /
  quests / flags. Phase 72 [ENGINE LANDED] primitive.
- New actions.resetRun wrapper in state/actions.ts, thin
  forward to the GameStore method (same cast pattern as
  allocateStatPoint).
- Mobile-side resetRunStats() stays alongside —
  encountersFaced / deepestNodeId are mobile-only run
  counters the engine doesn't track yet.

Decisions:
- keepCharacter: true is the only BEGIN AGAIN semantics
  (the button restarts the run, not the character).
- No engine bump — resetRun already landed in 0.11.0.
- Mobile run-stats counter stays on the combat-mode provider
  for now; folding into engine state would need an engine
  bump + content surface.

Closes #<phase-issue-number>
```

## 6. Follow-ups (out of scope)

- **Fold mobile run-stats into the engine.** Would need an
  engine bump that adds `runStats: { encountersFaced,
  deepestNodeId }` to GameState (and resets them in the
  RESET_RUN reducer branch). Then drop the mobile-side
  shim.
- **A "new game" / fresh-character BEGIN AGAIN variant.**
  Separate button, separate phase. Would call `resetRun({
  keepCharacter: false })`.
