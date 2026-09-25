# Phase 53b — The dialogue gate context, completed in the live path

> Agent-facing brief. The engine evaluates five kinds of dialogue gate
> correctly. Mobile hands it three of the five inputs, and `visibleChoices`
> fails closed — so 39 of the 44 authored gated choices can never render for
> any player. Mobile only. Second of the **narrative-encounters** batch;
> must land before 53c-53e author anything gated.

## Why this exists

`visibleChoices` (`src/NPCs/dialogue.ts`) is correct and proven at engine
level — `src/Game/e2e/old-marrow-observer.engine.test.ts` drives the full
observer cycle end to end. The break is that mobile builds the context by
hand and stops three fields in
(`axiomancer-mobile/state/presenters/event.engine.ts`, `composeNpcDialogue`):

```ts
const ctx = {
    activeQuests: new Set<string>(activeNames),
    completedQuests: new Set<string>(state.quests.completed as string[]),
    flags: new Set<string>(state.flags as string[]),
};
```

`alignment` and `lastSeenAlignmentCellId` are absent. `visibleChoices`
documents a missing field as *hide the choice* — deliberately, so a gate
fails closed rather than leaking content. Both gate kinds therefore evaluate
false for every player, in every conversation, permanently.

What that costs, counted across both rosters:

| gate | authored | renders in the app today |
|---|---|---|
| `requiresAlignment` | 33 | **no** |
| `playerAlignmentCellChangedSince` | 6 | **no** |
| `questCompleted` | 4 | yes |
| `flag` | 1 | yes |

Player-visible effect once 53a/53c make the NPCs reachable: Captain
Blackwater's greeting offers five replies on paper and shows two. The three
hidden ones are the trade-ethics branch, the quick-profit branch, and the
"your approach to commerce has shifted" recognition — precisely the ones
that make him a character rather than a shop sign.

## Inputs

1. `axiomancer-mobile/state/presenters/event.engine.ts` —
   `composeNpcDialogue` (the context), `computeEventViewModel` (the cursor
   branch that calls it).
2. `axiomancer-mobile/state/actions.ts` — `pickEventChoiceAction`, which
   applies a chosen choice; and the `dialogueCursor` seeding around L1804.
3. `axiomancer-mechanics/src/World/dialogue.runtime.ts` —
   `applyDialogueChoice`, which owns the `lastSeenAlignmentCells` write-back
   the observer gate compares against.
4. `axiomancer-mechanics/src/NPCs/dialogue.ts` — `DialogueContext`, the
   contract being satisfied.
5. `axiomancer-mechanics/src/Game/e2e/old-marrow-observer.engine.test.ts` —
   the engine-level proof; the mobile test mirrors its cycle.
6. `axiomancer-mobile/state/presenters/character.engine.ts:337` — proof that
   `state.philosophicalAlignment` is already on the store and already read.

## Scope

- **Supply `alignment`** from `state.philosophicalAlignment`, with the same
  `?? defaultAlignment()` fallback `character.engine.ts` and
  `actions.ts:792` already use. This half is a wire-up.
- **Supply `lastSeenAlignmentCellId`** from
  `state.lastSeenAlignmentCells[tree.id]`. This half is not a wire-up:
  **mobile never writes `lastSeenAlignmentCells` at all**, so the field has
  nothing to read until the write-back is carried through.
- **Carry the write-back through.** `applyDialogueChoice` already returns
  the updated `GameState`; the mobile choice path must persist the
  `lastSeenAlignmentCells` it produces rather than dropping it. Verify what
  `pickEventChoiceAction` currently spreads back onto the store — a field
  silently dropped here is the same defect wearing different clothes.
- **Persistence.** `lastSeenAlignmentCells` is save-visible. Check whether
  it survives a save/load round-trip through
  `state/persistence/migrations.ts`; if it does not, that is in scope, and
  decide deliberately whether it needs a `GAME_STATE_VERSION` bump (an
  absent field defaulting to `{}` should not — an absent field is exactly
  "no prior observation", which is the correct first-visit reading).
- **A gate-context regression witness** at the presenter level, so a future
  refactor cannot quietly drop a field again.

## Decisions made upfront — DO NOT ASK

- **Do not relax `visibleChoices`' fail-closed behaviour.** A missing field
  hiding a gated choice is correct: the alternative leaks unauthored content
  into the wrong playthrough. The fix is to supply the field.
- **Do not build the context inline a second time.** Extract one helper that
  produces a `DialogueContext` from `AppStoreState` and have every caller
  use it. Two hand-built contexts is how this bug persists.
- **Absent `lastSeenAlignmentCells` means "no prior observation", not
  "error".** First conversation legitimately hides the observer branch —
  that is the designed first-visit behaviour, pinned by the engine test.
- **The witness is Captain Blackwater, not a fixture.** Assert against the
  real authored tree. A synthetic tree would pass while the shipped content
  stayed broken, which is exactly the gap that let this survive: the engine
  test does use the real tree, and it passed the whole time.
- **Mobile-only.** No engine change is needed or permitted here — the
  runtime and the gate evaluator are both already correct.

## Surface as `[needs-user-call]`

- Only if the persistence check turns up a real migration need. A
  `GAME_STATE_VERSION` bump touches every existing save and is worth naming
  out loud rather than slipping in under a presenter fix.

## Prove (DoD)

- Presenter test: with `state.philosophicalAlignment` set past Blackwater's
  `scope >= 20` threshold, his greeting view-model carries the trade-ethics
  reply; below it, it does not.
- Observer cycle at mobile level, mirroring the engine test: first
  conversation hides the recognition branch; after a choice the cell is
  cached; after the alignment moves to a different cell, a later
  conversation surfaces it.
- Save/load round-trip preserves `lastSeenAlignmentCells`.
- A test that fails if the context loses a field — assert the helper's
  output has all five keys populated for a fully-specified state, not just
  that one gate happens to pass.
- `npm run verify --workspace axiomancer-mobile`.

## Follow-ups

- 53c-53e all depend on this. Until it lands, any authored gated branch is
  dead content, which is the mistake this whole batch exists to stop
  repeating.
- The engine-vs-live divergence here rhymes with the pending AUDIT row
  "[mobile] The live combat exit path bypasses the engine's end-of-combat
  reducer entirely": both are cases where mobile reimplements an engine
  contract by hand and drops part of it. Worth a line in that row's next
  read — not scope here.
