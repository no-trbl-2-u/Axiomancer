# Phase 17 — Guided first-session tutorial for the Quest Board

> Build-plan row: `Phase 17 — Quest Board ("The Boy's Almanac") first-session
> tutorial (GAP-001 follow-up), mirroring the Rest/Gathering/Combat
> tutorials (mobile)`.

## 0. Scope call (read this first)

Phase 16 shipped the Loot-Cache tutorial and queued Quest Board as the last
of the four GAP-001 follow-ups. Quest Board is structurally the odd one out:
it is not a single short visit like the other three but the entire
`build-the-boat` main-story quest — a `~3 lap, ~14-roll, 5-10 minute` session
by design (see `quest-board.types.ts` file header), and a naive auto-policy
probe against the pinned seed (below) actually takes **21 rolls over 4 days**
to reach `outcome`. Scripting a guided coach all the way to the true terminal
phase, the way Rest/Gathering/Hazard/Cache do, would mean either forcing ~20
rolls of unscripted play after the last banner or writing a script an order
of magnitude longer than any prior tutorial.

**Decision (autonomous call): the coach scripts only the opening loop** —
begin, cast the bone once, resolve whatever it lands on, and see the loop
come back around — then gets out of the way. The rest of the (still fully
live, un-completed) board plays out organically, same "teaches the
mechanic, not a curated victory" doctrine as every other tutorial, just
scoped to the loop's first iteration rather than the whole multi-day quest.
This mirrors the research recommendation and is the single biggest
departure from the Phase 16 brief's shape — flagged here, not silently
copied.

**Screen shape is also a departure from Phase 16.** Unlike the Reliquary
(one continuous `ScrollView`, no full-screen phases), the Quest Board screen
(`app/quest/index.tsx`) is a **hybrid**: the board itself (roll button,
charms tray, vows strip, escape hatch) renders inline in one `ScrollView`
(`idle` phase only, nothing covering it), but `intro` / `space` / `dusk` /
`outcome` each render as a full-screen `Scrim` overlay stacked on top,
exactly like Hazard's phase-gated overlays. So the coach needs **Hazard's
phase-guard discipline** (`session.phase !== 'idle' → return null`), not
Cache's unconditional-render pattern — there's no safe z-index slot to add
guidance while a scrim's own single-CTA button already owns the screen.

**Consequence for the step script:** because the coach can only ever render
during `idle`, and "the space was engaged" is only ever true again once
back at `idle` (which is also exactly when "the loop continues" becomes
true), one step's banner is structurally unable to ever be seen live — the
same class of accepted trade-off as Hazard's `resolve`/`outcome` steps and
Reliquary's `outcome` step, just one step earlier in the sequence here. Not
a bug; documented in §6.

## 1. Routes / API / CLI surface

No new routes. Reuses `/quest` (`app/quest/index.tsx`) unchanged in
structure; the coach renders as a bottom-docked overlay atop the base board,
gated to the `idle` phase only (see §0), literal guard-style template:
`components/hazard/HazardTutorialCoach.tsx`.

## 2. Content / data reads

| Helper | Call | Use |
|---|---|---|
| `createQuestBoardSession` (`@mechanics`) | via `beginQuestBoardAction(store, { tutorial: true })` | Pinned first-session board |
| `QUEST_TUTORIAL_STEPS` (new) | `currentTutorialStep(session, vm)` | Coach script cursor |

No new mechanics-side content — `build-the-boat`'s board layout, tuning
(`QUEST_BOARD_TUNING`), and the gather/duel/snag/etc. space resolvers are
unchanged.

**Seed 3, board `build-the-boat`.** Probed directly against
`createQuestBoardSession` / `rollQuestBone` / `chooseQuestSpaceOption`:

```
create(3, 'build-the-boat') → intro: fish 15, vigor 8/8,
  charms [gull-feather, friends-whistle], vows [tale-collector, unbitten]
begin → idle
rollQuestBone → phase 'space', pos 1, lastRoll {die:1, bonus:0, total:1},
  stretch 1, pending: DRIFTWOOD COVE (gather), options ['press', 'stop']
chooseQuestSpaceOption('press') → haul 2, presses 1, result still null
chooseQuestSpaceOption('stop')  → result "THE HAUL COMES HOME DRY",
  +2 HULL PLANKS (partsDelta.plank = 2), parts.plank = 2
continueQuestSpace → phase 'idle', stretch 1, day 1, pending null
```

Verified live (not just researched) via a direct engine probe — see command
transcript in the shipping commit body. Clean, single-roll teach of the
GATHER press-your-luck loop (closest engine analog to Reliquary's dice-pool
push) with zero bust risk realized on this path, landing back at `idle` in
exactly one full loop. `QUEST_BOARD_TUNING.stretchesPerDay = 6`, so stretch 1
of 6 never triggers `dusk` — the loop returns cleanly to `idle` for the
script's final step.

## 3. Components / handlers

New:
- `components/quest/tutorial-steps.ts` — `QuestTutorialStep[]` +
  `currentTutorialStep(session, vm)`. Literal template:
  `components/hazard/tutorial-steps.ts` (predicate shape), scaled to 3
  steps per §0/§6.
- `components/quest/QuestTutorialCoach.tsx` — bottom-docked banner,
  phase-gated (`session.phase !== 'idle' → null`), literal template:
  `components/hazard/HazardTutorialCoach.tsx`.
- `components/DebugEncounterButtons.tsx` — the existing `DEBUG · QUEST
  BOARD` row becomes a two-button row (`TUTORIAL` ahead of the existing
  `UNFOLD` button), template: the file's own `DebugCacheRow()` (TUTORIAL +
  DIG two-button row).

Reused: `makeStyles`/`usePalette` (`@/theme/runtime`), `FONTS`
(`@/theme/axm`), `react-native-reanimated` `FadeInDown`.

## 4. Cross-links

- **In:** the organic map-triggered quest path (`state/actions.ts`, the
  `result.event.kind === 'quest'` branch) starts the tutorial automatically
  for a save without `QUEST_TUTORIAL_FLAG`, mirroring the
  hazard/gathering/rest/cache triggers exactly. This is currently the only
  one of the five encounter triggers with **no** tutorial gate at all
  (`beginQuestBoardAction(store, { boardId: result.event.boardId })`,
  unconditional) — Phase 17 adds the gate.
- **Out:** none (Quest Board is a dead-end minigame from the map's
  perspective; claim/abandon returns to the map).
- **Retro-fit:** none needed — `components/dev/DevToolsSections.tsx`
  already lazy-imports and renders `<DebugEncounterButtons>`; the new
  button lands inside that existing file, no new wiring there.

## 5. Output schema / contracts

```ts
// state/quest/store-actions.ts
export const QUEST_TUTORIAL_FLAG = 'quest-tutorial-done';
export const QUEST_TUTORIAL_SEED = 3;

export interface BeginQuestBoardOptions {
    boardId?: string;
    seed?: number;
    /** Start the guided first session (pinned seed unless overridden). */
    tutorial?: boolean;
}

export function completeQuestBoardTutorialAction(store: AppStore, skipped: boolean): void;
```

`beginQuestBoardAction` gains the `tutorial` option: when true, resolves the
seed via `resolveMinigameSeed('quest', options.seed,
globalThis.__AXM_QUEST_SEED__, QUEST_TUTORIAL_SEED)` (mirrors
hazard/gathering/cache's precedence chain exactly) and sets
`quest: { session, tutorial: true }`. `boardId` keeps resolving through the
existing `resolveMinigameString` chain, defaulting to `QUEST_BOARDS[0].id`
(`'build-the-boat'`) either way — the tutorial doesn't need to override it
since the first-ever quest already targets that board. A normal (organic,
non-tutorial) call keeps `tutorial: false`. `setSession` (the internal
helper) starts preserving the slice's `tutorial` field across in-session
updates, the same shape as `state/cache/store-actions.ts`'s `setSession`.

```ts
// state/store.ts
export interface MobileQuestSlice {
    session: QuestBoardSession | null;
    /** True while this session is the guided first session. */
    tutorial: boolean;
}
export const EMPTY_QUEST_SLICE: MobileQuestSlice = Object.freeze({
    session: null,
    tutorial: false,
});
```

`AppActions` gains `completeQuestBoardTutorial: (skipped: boolean) => void`,
wired the same way as `completeHazardTutorial` / `completeGatheringTutorial`
/ `completeRestTutorial` / `completeLootCacheTutorial`.

## 6. Hero / body / sub-section composition

Coach banner (mirrors Hazard's exactly, since both are phase-gated):
eyebrow `THE FIRST SESSION · N / TOTAL`, title, body copy, `lookFor` hint
line, `SKIP ✕` in the header row. Bottom-docked well above the board's
roll button (the base board's `rollButton` sits mid-scroll, not pinned to
the screen bottom like Hazard's hand fan — dock at `bottom: 24`, Rest's
convention, since Quest's `idle`-phase content scrolls like Rest's does).

**Two steps, not the usual four to six** (revised during implementation —
see the correction note below): `phase` cycles `idle ⇄ space` every loop
rather than passing through once the way Hazard's `playing` phase does, so
a predicate gated on "left the space phase" is not monotonic here — a
later loop reopens a new space and un-flips it. Only `metrics.rolls`,
which never decreases, is safe to key a step on:

1. `roll` — "CAST THE BONE" — tap the bone die at the board's heart; it
   moves your piece and opens whatever it lands on — every space plays
   its own small game. Read the card, make a choice, then WALK ON to
   close it out. `done: (s) => s.metrics.rolls >= 1`. This step's body
   previews the whole loop up front (roll → read → WALK ON) since there
   is no safe render slot to narrate the middle of it — the coach only
   ever renders during `idle`.
2. `again` — "THE LOOP CONTINUES" — watch VOWS and the hull ledger fill as
   the board turns; cast the bone again whenever ready.
   `done: (s) => s.metrics.rolls >= 2 || s.phase === 'dusk' || s.phase ===
   'outcome' || s.phase === 'done'` — the OR-across-terminal-phases shape
   used by every prior tutorial's final step, for the same reason: a
   player who happens to end day 1 or complete the board outright on their
   next roll still completes the script.

**Correction note (caught during implementation, not in the original
draft of this brief):** the first draft of this section specified a
three-step script with a middle `space` step gated on
`s.phase !== 'space'`. A live engine e2e test (`quest.tutorial.engine.test.ts`)
caught that this predicate is not monotonic — after the *second* roll
reopens a new space, `phase` becomes `'space'` again and the step's `done`
result flips back to `false`, breaking the stateless-scan contract every
other tutorial's steps rely on (a later loop must never un-satisfy an
earlier step). Rolled back to the two-step script above rather than
patching around it with extra state.

## 7. Empty / loading / error states

Coach renders `null` when `currentTutorialStep(...) === -1` (script done),
`quest.tutorial !== true`, or `session.phase !== 'idle'` (§0/§6 phase
guard). No loading/error states — the coach is a pure derived overlay, same
as every prior tutorial's.

## 8. Decisions made upfront — DO NOT ASK

- **Script covers only the opening loop, not the full multi-day quest.**
  See §0 — a naive auto-policy probe on the pinned seed takes 21 rolls / 4
  days to reach `outcome`; scripting to the true terminal phase would mean
  either forcing ~20 more rolls of unscripted play or a script an order of
  magnitude longer than any prior tutorial. The coach teaches the loop
  shape (roll → resolve → loop) and gets out of the way; the rest of the
  quest plays out organically, same as it always has.
- **Coach is phase-gated to `idle` only** (unlike Rest/Gathering/Cache,
  like Hazard) — Quest's `intro`/`space`/`dusk`/`outcome` are each
  full-screen `Scrim` overlays with their own single-CTA affordance; there
  is nothing for the coach to add and no safe z-index slot during those
  phases.
- **Seed 3, board `build-the-boat`.** Probed directly against
  `createQuestBoardSession`/`rollQuestBone`/`chooseQuestSpaceOption` (see
  §2) — a clean single-roll teach of the GATHER press-your-luck loop with
  zero bust risk realized, landing back at `idle` after exactly one loop
  (stretch 1 of 6, well short of `dusk`).
- **No forced clean run.** The GATHER spot's bust chance (rogue wave on a
  die ≤ `bustFloor`) still exists on any later loop the player takes past
  the scripted one — the coach teaches the mechanic, not a curated
  always-wins outcome, same doctrine as every prior tutorial.
- **CHARMS (priming a one-use trinket) is out of scope** — a real,
  always-available action, but optional, and the pinned seed's first loop
  doesn't need one; forcing a charm-priming beat into the script would mean
  either padding it for an optional move or fighting the pinned seed's
  natural first loop. Same class of exclusion as Reliquary's Insight
  charge and Hazard's FORETELL.
- **The tutorial trigger doesn't need to override `boardId`** (unlike
  Hazard overriding the triggering node's hazard id, or Cache overriding
  tier/currency) — the very first quest a save can ever trigger already
  targets `build-the-boat` (`QUEST_BOARDS[0]`), so the tutorial's pinned
  seed is the only override needed.
- **`DebugEncounterButtons`'s QUEST BOARD row gains a TUTORIAL button**
  (existing UNFOLD button untouched), matching `DebugCacheRow`'s two-button
  row.

## 9. Mobile reflow / responsive

No new layout risk — the coach is an absolutely-positioned overlay atop the
existing `QuestScreen`'s `ScrollView`, same positioning class as
Hazard's/Rest's. No dedicated `quest.mobile.spec` exists today, consistent
with rest/gathering/hazard/cache not having one either.

## 10. Pages × tests matrix

| Surface | Test |
|---|---|
| `components/quest/tutorial-steps.ts` | `components/quest/__tests__/tutorial-steps.test.ts` — predicate unit tests, template: hazard's `tutorial-steps.test.ts` |
| `components/quest/QuestTutorialCoach.tsx` | `components/quest/__tests__/QuestTutorialCoach.test.tsx` — render test, template: hazard's `HazardTutorialCoach.test.tsx` |
| Store wiring (flag, slice, trigger) | `state/e2e/quest.tutorial.engine.test.ts` — hermetic store-level e2e, template: `state/e2e/cache.tutorial.engine.test.ts` |

## 11. Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

Mechanics untouched — no mechanics/card-editor verify needed (no
`@mechanics` public-surface change).

## 12. Commit body template

```
feat(mobile): guided first-session quest-board tutorial — phase 17

- <bullets>

Decisions:
- <picked X over Y because ...>

Closes #<phase-issue-number>
```

## 13. DoD

- [ ] `QUEST_TUTORIAL_FLAG` / `QUEST_TUTORIAL_SEED` / `tutorial` slice field
      / `completeQuestBoardTutorialAction` shipped in
      `state/quest/store-actions.ts` + `state/store.ts`.
- [ ] `components/quest/tutorial-steps.ts` +
      `components/quest/QuestTutorialCoach.tsx` shipped, wired into
      `app/quest/index.tsx`, phase-gated to `idle`.
- [ ] Organic map-trigger in `state/actions.ts` starts the tutorial for a
      flag-less save (the `quest` branch currently has no gate at all).
- [ ] `components/DebugEncounterButtons.tsx`'s QUEST BOARD row gains the
      TUTORIAL button.
- [ ] All three test files in §10 pass.
- [ ] `npm run verify --workspace axiomancer-mobile` green.

## 14. Follow-ups (out of scope)

GAP-001 follow-up queue is now empty — Rest, Gathering, Hazard, Cache, and
Quest Board all have guided first-session tutorials. Net-new follow-ups
worth a future `/expand` candidate, not a numbered phase on its own:

- A CHARMS-priming beat (deferred here — see §8), either folded into a
  later Quest Board content pass or a standalone "advanced play" tip
  surfaced after N sessions.
- A "the quest continues beyond this tutorial" nudge if playtesting shows
  players mistake the coach's exit for the quest being over.
