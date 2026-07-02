# Spec 04 — Combat Screen Wiring

> Status: [DONE on 2026-05-12 — see this branch's PR]

## Goal

Replace `app/(tabs)/combat.tsx`'s hard-coded fixtures with engine-
driven data via `selectCombatViewModel`. Player stance / action /
skill picks dispatch through the engine's combat reducer; the screen
only renders. The hermetic e2e covers the full four-phase
`choosing_stance → choosing_action → choosing_skill → resolving`
loop.

**Success state:** Picking a stance in the UI calls
`actions.setPlayerStance`. Picking an action calls
`actions.setPlayerAction`. Resolving a round calls the engine's
`resolveCombatTurn` (or `resolveCombatRound` per engine Spec 02)
through the action layer. The HP bars, effect chips, friendship meter,
and mind-mark display all reflect engine state.

## Why now / dependencies

- **Unblocks:** Spec 05+ (every other screen follows the same
  pattern; this is the most complex so getting it right de-risks the
  rest).
- **Depends on:** Spec 01, 02, 03. Optionally engine Spec 02
  (resolver export) — works without it but cleaner with.

## Current state

- `app/(tabs)/combat.tsx` is ~460 lines. Most of it is JSX + style
  blobs.
- Combat phases are local state (`useState<CombatPhase>('choosing_stance')`).
  Stance is local state too (`useState<Stance>('heart')`).
- `STANCE_DATA`, `SKILLS`, `BEATS`, `PHASE_LABELS`, `LOG_LINES` are
  module-level constants. `BEATS` and `STANCE_DATA` should move to
  the presenter; `LOG_LINES` should come from the engine's combat log.
- The skills list is hard-coded; the engine's skills system is
  partially specced (engine Spec 04) and not yet shipped — see
  Q5 below.

## Open questions

1. **Phase ownership.** Today phase is `useState`. With the engine,
   `combat.phase` already exists in `CombatState`. Move phase to the
   engine, or keep it local UI state?
   - (A) **(default)** Engine. Phase transitions are part of the
     game model.
   - (B) Local. Phases are a UI concept (the engine resolves a round
     atomically; phases are just step-by-step prompts in the UI).
   > Your answer: A

2. **Stance preview vs. confirmed.** The current UI lets the player
   pick a stance but visually pre-selects with `selected = 'heart'`.
   Two ways:
   - (A) **(default)** Local UI state until the user taps "confirm";
     dispatched on confirm. Engine state only sees the committed
     stance.
   - (B) Dispatch on every tap; the engine receives every preview.
   > Your answer: A

3. **Skill list source.** The 6 hard-coded skills in `combat.tsx`:
   - (A) **(default)** Punt to engine Spec 04 — for now read from a
     local fixture (`app/(tabs)/combat/skills.fixture.ts`) but mark
     the import path with a `// TODO: replace with engine skills` so
     it's grep-able.
   - (B) Block on engine Spec 04 — don't ship combat wiring until
     skills are real.
   - (C) Mock the engine API in this repo (`useGameState(s =>
     s.player.equippedSkills)`) and back-fill engine Spec 04 later.
   > Your answer: A

4. **Battle log rendering.** The mock has 2 log lines per phase. The
   engine emits a structured log (`appendLog(...)`). VM should:
   - (A) **(default)** Tail the last N entries (N=4) and render as
     plain text.
   - (B) Categorise by severity (info / damage / crit) and tint.
   - (C) Render the full log in a scroll view.
   > Your answer: C but font color changes depending on the information in the log

5. **Round transition animations.** The mock UI has no transition.
   When `resolving → choosing_stance`:
   - (A) **(default)** No animation; instant. Reanimated transitions
     are flagged as Spec 12 / asset polish.
   - (B) Simple fade via Reanimated — write a hermetic test mocking
     `Animated.timing` so the assertion runs on the post-transition
     state.
   > Your answer: Have the selections be a carousel. Slide left to reselect stance. "Skills" selection should slide to right to show available skills

6. **Flee.** The mock UI mentions "or … flee like a craven (luck
   save)". The engine has no flee action today. Pick:
   - (A) **(default)** Hide the flee link until engine ships flee.
   - (B) Implement flee in the engine first, then wire it.
   - (C) Leave the link as a no-op with a "coming soon" toast.
   > Your answer: C

## Proposed approach

1. **Move `combat.tsx` into a folder** — `app/(tabs)/combat/index.tsx`
   plus `combat.engine.ts`, `combat.mock.ts`, `e2e/combat.engine.test.ts`.
2. **Implement `selectCombatViewModel`** consuming
   `state.combat: CombatState`. Output:
   ```ts
   type CombatViewModel = {
     phase: CombatPhase;
     enemy: { name; tier; hpRatio; friendshipRatio; mindMarks; lastStance; effects };
     player: { hpRatio; manaRatio; effects };
     stancePicker: { stances: StanceOption[]; selected; canConfirm };
     actionPicker: { actions: ActionOption[] };
     skillPicker: { skills: SkillOption[]; mana };
     resolve: { advLabel; rolls; outcome };
     log: string[];
   };
   ```
3. **Implement the action layer** for combat — `combatActions.setStance`,
   `combatActions.confirmAction`, `combatActions.pickSkill`,
   `combatActions.resolveRound`. Each delegates to the engine.
4. **Refactor `combat.tsx`** to:
   - Read `vm = useGameState(selectCombatViewModel)`.
   - Pass `vm.<slice>` to each phase sub-component.
   - Wire `onPress` → `combatActions.<...>`.
5. **Hermetic e2e under `app/(tabs)/combat/e2e/combat.engine.test.ts`**:
   - Happy path: full round through all four phases ends in
     `phase === 'choosing_stance'` with reduced enemy HP.
   - Each terminal: enemy KO → combat end with player victory; player
     KO → combat end with defeat; max friendship → friendship win.
   - Invariants: `hpRatio ∈ [0, 1]`; `phase` only advances forward
     within a round; selecting a stance with `mana < skillCost`
     marks every skill `disabled: true`.
   - Lifecycle: `createGameStore(memoryAdapter, …).startCombat(...)`
     → drive 5 rounds → `memoryAdapter.save` not called (Spec 09
     opts in to autosave; Spec 04 stays read-only).
6. **Component render test** at
   `app/(tabs)/combat/index.test.tsx` — render with a fixture
   `CombatViewModel` per phase, assert phase header text.
7. **Update `docs/combat.md` (new)** — short doc describing what the
   screen renders for each phase.

## Acceptance checklist

- [x] All 6 questions answered.
- [x] Combat surface area is fully extracted from `app/`. Per the
      route-tree guard in [`state/e2e/route-tree.engine.test.ts`](../state/e2e/route-tree.engine.test.ts)
      and the convention pinned in [`docs/presenters.md`](../docs/presenters.md),
      non-route files must live **outside** `app/`. This deliberately
      diverges from this spec's original wording of
      `app/(tabs)/combat/index.tsx` + co-located engine/mock files.
      The final shape:
      `app/(tabs)/combat.tsx` (route shell),
      [`state/presenters/combat.engine.ts`](../state/presenters/combat.engine.ts) (presenter),
      [`state/mocks/combat.mock.ts`](../state/mocks/combat.mock.ts) (encounter fixture),
      [`state/mocks/combat.skills.fixture.ts`](../state/mocks/combat.skills.fixture.ts) (placeholder skills),
      [`state/actions.ts`](../state/actions.ts) (combat action layer),
      [`state/e2e/combat.engine.test.ts`](../state/e2e/combat.engine.test.ts) (hermetic e2e),
      [`state/e2e/combat.screen.test.tsx`](../state/e2e/combat.screen.test.tsx) (component render),
      [`docs/combat.md`](../docs/combat.md) (screen doc).
- [x] No literal `enemy = { … }` or `player = { … }` in the screen.
- [x] `STANCE_DATA`, `BEATS`, `PHASE_LABELS` moved to the presenter
      (`STANCE_DERIVED`, `BEATS`, `PHASE_LABELS` in
      [`combat.engine.ts`](../state/presenters/combat.engine.ts)).
- [x] e2e covers all four phases + every terminal condition (player
      KO, enemy KO, friendship terminal) + invariants + a
      `memoryAdapter.save not called` lifecycle assertion across five
      rounds.
- [x] Component render test renders all four phases without error
      ([`combat.screen.test.tsx`](../state/e2e/combat.screen.test.tsx)).
- [x] `npm test` green twice (110 tests); `npx tsc --noEmit` clean.

## Out of scope

- Skills engine — engine Spec 04.
- Flee — engine spec TBD.
- Animations / transitions — Spec 12.
- Sound effects — flagged for `BRAINDUMP.md`.
