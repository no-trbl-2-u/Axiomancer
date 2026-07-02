# Spec 08 — Event Screen Wiring `[DONE on 2026-05-15 — see commit beba7d4]`

## Goal

Replace `app/(tabs)/event.tsx`'s hard-coded encounter / boss
illustrations and choice rows with engine-driven narrative data via
`selectEventViewModel`. Picking a choice dispatches through the engine
(resolver name and state shape **TBD** until engine Spec 09 pins the
mobile-facing contract — see Current state).

**Success state:** When the player has a pending authorable multi-choice
narrative (map event, dialogue branch surface, or dedicated event slice —
exact shape is an engine Spec 09 decision), the mobile store exposes it to
presenters; the screen renders prompt and choices; each choice calls the
engine-backed action that advances that narrative and updates `GameState`.
(Illustrative names used elsewhere in the plan: `activeEvent`,
`resolveEvent(choiceId)`, `EventChoice[]` — none of these exist on
`GameState` in `axiomancer-mechanics@0.4.1`.)

## Why now / dependencies

- **Unblocks:** quest / story polish once the engine + store expose a stable
  narrative contract.
- **Depends on:** Spec 01, 02, 03, 07.
- **Engine (canonical — `axiomancer-mechanics/specs/`):**
  - **Spec 08 — DONE** (`08-world-content-and-hazards.md`): `processNode`,
    `moveToNode`, `MapEvent`, NPC `DialogueTree`, `applyDialogueChoice`.
    Note: `MapEvent.type === 'event'` is **rest** (instant heal + text), not
    a generic multi-choice node. Branching choices today live on **NPC
    dialogue**, returned from `processNode` as `{ kind: 'npc', dialogue }`.
  - **Spec 09 — OPEN** (`09-game-loop-orchestration.md`): top-level
    orchestration; expected to wire `moveToNode` / `processNode` /
    `applyDialogueChoice` into `createGameStore` (or equivalent) so the app
    is not re-implementing exploration transitions ad hoc.
  - **Spec 12 — OPEN** (`12-package-architecture-and-events.md`): typed UI
    event channel; relevant if the product wants log-style events vs only
    state diffs.

## Current state

- `app/(tabs)/event.tsx` ships with a literal encounter scene + boss
  scene (procedural SVG illustrations described in
  [`SVG_ASSET_SPEC.md`](../SVG_ASSET_SPEC.md) sections 7a / 7b).
- **`GameState` (engine 0.4.1)** has `version`, `player`, `world`, `combat`,
  `quests`, `flags` — **no** `session`, **no** `activeEvent`, **no**
  `resolveEvent` action on `createGameStore`.
- **Shipped world/narrative primitives:** `MapEvent` / `UniqueEvent` types,
  `completeUniqueEvent`, `processNode`, `ProcessNodeResult` / `ProcessedEvent`,
  `moveToNode`, `applyDialogueChoice` (see `docs/world.md` in mechanics).
- **Gap for this spec:** there is still no first-class, mobile-trivial
  “pending event + pick choice ID” slice. Wiring the Event tab may **reuse**
  NPC dialogue (`applyDialogueChoice`) or wait for a dedicated reducer —
  that split is engine Spec 09 + product answers below.

## Open questions

1. **What an "event" is.** The mock conflates "boss encounter" with
   "story choice node". Define:
   - (A) **(default)** Two distinct VM kinds: `combat-prelude` (foe
     intro before combat starts) and `narrative-choice` (text + 2-4
     choices).
   - (B) One unified `Event` with optional combat hand-off.
   > Your answer: A

2. **Choice consequences.** Each choice has stat cost, item gain,
   stance lock, etc. Should the VM:
   - (A) **(default)** Expose machine-readable consequences (`{ kind:
     'damage', amount: 3 }[]`) so the screen can preview them.
   - (B) Only the human-readable description; the engine resolves on
     pick.
   - (C) Both.
   > Your answer: C

3. **Illustrations.** Mock has a procedural "Encounter" and a
   procedural "Boss" SVG. Real assets per `SVG_ASSET_SPEC.md`
   sections 7a / 7b. Use:
   - (A) **(default)** Engine event includes an `art: string` slug;
     mobile maps slug → asset.
   - (B) Mobile owns the slug-to-asset map locally.
   > Your answer: B

4. **Resolving an event mid-combat.** Some events (a tempting voice
   inside a boss fight) might dispatch *during* combat. In scope or
   future spec?
   > Your answer: Future spec

5. **Skip animation.** Reading large text blocks on mobile is slow.
   Add a "skip" button?
   > Your answer: Yes

## Proposed approach

1. **Move `event.tsx` into a folder** — `app/(tabs)/event/index.tsx`
   plus `event.engine.ts`, `e2e/event.engine.test.ts`.
2. **Implement `selectEventViewModel`** consuming whatever **pinned**
   engine/store field ends up holding the pending narrative (today:
   **blocked** — field does not exist; do not invent `state.session`).
3. **Action layer** — thin wrappers over engine actions (names TBD;
   illustrative: `eventActions.pickChoice(choiceId)`,
   `eventActions.dismiss`).
4. **Refactor the screen.**
5. **Hermetic e2e**:
   - Happy path: a fixture narrative state → render → pick choice → state
     updates.
   - No pending narrative → screen shows empty / "no event in progress".
   - Lifecycle: engine (or store orchestration) sets pending narrative;
     presenter reflects it.

## Acceptance checklist

- [x] All 5 questions answered (A / C / B / Future spec / Yes — see
      lines 63 / 72 / 80 / 85 / 89 above).
- [x] `app/event/` folder exists. Note: the folder lives at the
      route-tree root (not under `(tabs)/`) because Phase 14
      (`5dd597b`) moved the event screen out of `(tabs)/` and behind
      a `fullScreenModal` Stack.Screen. Folder shape: `app/event/index.tsx`
      + illustration components in `components/event/` (kept outside
      `app/` so expo-router's `*.tsx` discovery doesn't treat them
      as routes).
- [x] Procedural illustrations remain *as placeholders* but their
      slugs come from the presenter contract
      (`state/presenters/event-assets.ts` — Spec 08 Q3 = B,
      mobile-local slug-to-art mapper). Engine `ProcessedEvent`
      discriminant drives slug selection.
- [x] Hermetic e2e green. New tests:
      `state/e2e/event.engine.test.ts` (rewritten, fixture-driven),
      `state/e2e/event-assets.test.ts` (new, exhaustive switch),
      `state/e2e/event.screen.test.tsx` (new, render + pick
      dispatch).
- [x] `npm test` and `npx tsc --noEmit` clean. Verify green at
      321 / 321 hermetic tests as of `beba7d4`.

## Implementation summary

Shipped across four sub-ticks on 2026-05-15:

- **Tick A** (`2c4d2b0`) — presenter + store slice. `MobileEventSlice`
  in `state/store.ts` (`pending`, `dialogueCursor`, `history`);
  `AppStoreState = GameStore & { event: MobileEventSlice }`.
  `selectEventViewModel` composes the VM from
  `ProcessNodeResult` + `DialogueTree` cursor with two VM kinds
  (`combat-prelude`, `narrative-choice`).
- **Tick B** (`31e42f0`) — action layer. `processCurrentNode`,
  `pickEventChoice`, `dismissEvent` on `AppActions`. NPC dialogue
  walks `getDialogueNode` / `applyDialogueChoice` to advance the
  cursor; combat-prelude `'fight'` dispatches `startCombat`.
- **Tick C** (`beba7d4`) — screen refactor. `app/event.tsx` →
  `app/event/index.tsx`; illustrations moved to
  `components/event/{Encounter,Boss,Placeholder,EventArt}Illustration.tsx`
  (outside `app/` so they're not router-discovered). Consequence
  chips render under each choice; skip button gates on `canSkip`.
- **Tick D** (this commit) — close-out: spec acceptance ticked,
  Phase 6 row flipped, Phase 19 row closed as drained by Phase 6
  (`selectHasActiveEvent` flipped to engine truth in Tick A).

## Out of scope

- Real assets — Spec 11.
- Authoring full world content — engine content effort.
- In-combat events — flagged in Q4 for a later spec.
