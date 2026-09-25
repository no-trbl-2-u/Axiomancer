# Phase 61 — Retire the Quest Board minigame ("The Boy's Almanac")

## Outcome

The Quest Board minigame — `World/QuestBoard/`, its `quest` MapEventKind,
mobile wiring (`state/quest/`, `components/quest/`, `<QuestGate>`,
`/quest`), CLI driver, and tuning harness — is deleted entirely. The
QuestLog objective tracker (`World/quest.engine.ts`, `quest.library.ts`,
`state.quests`) is explicitly untouched and stays load-bearing: with no
map node launching the minigame, Old Marrow's quest-giver dialogue at
fv-2 (Phase 53c) is the only way a player learns `starting-quest`
exists.

## Problem (from `01_build_plan.md`)

**T direct, 2026-08-15:** the quest event is *"a little bit harder for
now, let's just remove it entirely"* — then, asked which of the two
systems named "quest" that meant, *"Minigame only and keep it."* This
row was reprioritized to the front of the queue (ahead of Phase 58) by
a later 2026-08-22 session.

## Scope

Both workspaces. This is a pure deletion + one map-content reassignment,
not a redesign — no new UI, no new content beyond what a clean removal
requires.

### Mechanics (`axiomancer-mechanics`)

- Deleted `src/World/QuestBoard/` entire (engine, sim, rng, types,
  content, tuning) and its CLI driver
  (`src/CLI/quest-board.cli.ts` + test), plus the `quest-board` npm
  script and its `game.cli.ts` subcommand dispatch.
- Removed the `quest` `MapEventKind` (`MapEvents/types.ts`): the kind
  itself, `QuestEventPayload`, the `ResolvedEvent`/`MapEventPayload`
  union members, `resolveQuest`/dispatch-table entry
  (`MapEvents/handlers.ts`), and the barrel re-exports
  (`World/index.ts`, `src/index.ts`).
- **fv-15** (fishing-village's sole `quest` node, "build-the-boat")
  rejoins the encounter roster as `foot-stealer` — a level-3 foe
  orphaned by Phase 60's fv-21 blacksmith re-home (no flag/pricing
  dependency), matching `FV_BOSS_LEVEL`/fv-24's water-holger tier and
  sitting one column ahead of the fv-6 boss. Fishing-village's kind
  census: encounter 3→4 (still tied for largest alongside interaction
  and rest, no dominance).
- **The Aporia (Labyrinth) also fired `quest`** on each act's pre-boss
  "ledger" room (`act.questRoom`/`act.questBoardId`, discovered while
  tracing every `quest`-kind emitter) — a latent bug, since none of its
  three boardIds (`sophists-{first,second,third}-ledger`) were ever
  registered in `quest-board.content.ts` (only `build-the-boat` was), so
  reaching one would have thrown `QuestBoard: unknown board '...'`.
  `labyrinth.pools.ts`'s `overridePool` now emits the room's own
  `narration` (reusing `room.narration`, the same pattern already used
  for entrance/gate rooms) instead of a `quest` payload. `questBoardId`
  is dropped from `LabyrinthActDef` and the three act content files;
  `questRoom` itself is UNTOUCHED — it also gates the act3 "settle debt
  (the Fourth Ledger)" action (`labyrinth.cli.ts`,
  `state/presenters/labyrinth.engine.ts`), an unrelated mechanic that
  happens to live on the same room id.
- `World/minigame-harness.{types,resolver}.ts` + its e2e test: the
  Quest Board arm (`'quest-board'` `MinigameId`, `questBoard` report/AB
  fields) dropped; the harness now orchestrates hazard + gathering only.
- `World/e2e/minigame-seed-contract.engine.test.ts`: the QuestBoard
  replay-seed case removed.
- `test-utils/e2e/hermeticity.audit.test.ts`: the deleted CLI test's
  IO-allowlist entry removed.
- `Game/game.migrate.ts` + `game.reducer.ts`: `GAME_STATE_VERSION`
  17→18. New `migrateV17ToV18` hop clears a live quest-board session
  riding along in the raw payload's mobile-only `quest` key (mirrors
  Phase 52e's `rest`-key clearing). New hermetic migration test
  (`Game/e2e/quest-board-retirement-migration.engine.test.ts`).
- Docs: `docs/encounters/quest-board.md` marked HISTORICAL (Phase 52e's
  `rest.md` precedent); `docs/cli.md`'s driver section removed;
  `docs/world.md`'s MapEventKind table, dispatch note, fv-15 mention,
  and minigame-sim section updated; `docs/testing.md`'s harness example
  updated to two minigames.

### Mobile (`axiomancer-mobile`)

- Deleted `state/quest/store-actions.ts`, `state/presenters/quest.engine.ts`,
  `components/quest/` (all seven files + tests), `components/QuestGate.tsx`
  (+ test), `app/quest/index.tsx`, and
  `state/e2e/{quest.flow,quest.screen}.engine.test.ts`.
- `state/actions.ts`: the eleven `beginQuestBoard…abandonQuestBoard`
  interface methods, their wiring, and the `result.event.kind ===
  'quest'` interceptor branch removed.
- `app/_layout.tsx`: `<QuestGate>` and the `/quest` stack screen
  removed.
- `state/store.ts`: `MobileQuestSlice`, `EMPTY_QUEST_SLICE`, the
  `quest` field on `AppStoreState`, and the initial-state assignment
  removed.
- `state/presenters/navigation.engine.ts`: `selectHasActiveQuestBoard`
  import + its `selectHasAnyActiveSession` contribution removed. (The
  QuestLog's own `questAcknowledged`/`questPending` badge logic in the
  same file is untouched — different system, same word.)
- `state/presenters/exploration.engine.ts` / `event.engine.ts` /
  `event-assets.ts`: the `quest`-kind branch of each `Record<MapEventKind,
  …>` / exhaustive switch removed. The **display** `NodeType`/`EventVariant`
  value `'quest'` (the shared "LORE" icon/badge borrowed by
  interaction/cutscene/narration nodes) is a *different, still-live*
  concept and is untouched.
- `state/minigame-seeds.ts`: `'quest'` dropped from `MinigameSeedKey`;
  the now-dead `boardId`/`board` fields dropped from `MinigameSeedEntry`.
- `components/DebugTriggerEncounter.tsx` / `DebugEncounterButtons.tsx`
  (+ their tests): the QUEST debug trigger/button removed.
- Updated tests: `state/e2e/map-encounter-minigames.engine.test.ts`
  (dropped the quest-launch case, refreshed the fishing-village kind
  census), `state/e2e/exploration.engine.test.ts` (fv-15 is now an
  encounter, locked from fv-2 — no longer a "non-trigger by type"
  example), `state/__tests__/minigame-seeds.test.ts` +
  `state/e2e/minigame-seeds.engine.test.ts` (quest arm dropped).
- `design/encounters/quest-board.md` marked HISTORICAL;
  `README.md`'s route table entry removed.

## Player-visible impact

- Fishing-village's fv-15 is a `Foot-Stealer` fight instead of the
  quest board. No route in the game still opens `/quest`.
- The Labyrinth's three pre-boss ledger rooms narrate the Sophist's
  scripted line (previously authored, previously unreachable without
  crashing) instead of attempting a board that never existed.
- The Memoir tab's QuestLog section (active/completed `starting-quest`)
  is unaffected; Old Marrow (fv-2) remains the sole quest-giver.

## Decisions made upfront — DO NOT ASK

1. **fv-15 becomes an encounter, not left to throw.** The registration
   loop's fallback (`FV_ENCOUNTER_FOES[nodeId]` or throw) requires
   *some* assignment; reversing the very displacement Phase 53c/60
   documented (an authored kind always displaces FROM an encounter
   slot) is the lowest-risk, best-precedented choice.
2. **`foot-stealer`, not a new foe.** Already-authored, already
   level-appropriate (3, matching the boss's `FV_BOSS_LEVEL` and
   fv-24's water-holger), and already orphaned by Phase 60 — reusing it
   needs no new content and no rebalancing.
3. **The Labyrinth's quest rooms are in scope, not a follow-up.**
   `quest` is a single `MapEventKind`; keeping it alive solely for
   three rooms that would crash on arrival isn't a reasonable
   alternative to fixing them in the same phase that deletes the kind
   they depend on.
4. **Narration over a new minigame stand-in for the ledger rooms.**
   `labyrinth.pools.ts` already has an established pattern (entrance/gate
   rooms reuse `room.narration` verbatim via the same `monologue()`
   helper) — following it needs no new authored prose and matches the
   room's own already-written "the house requires its paperwork" beat.
5. **`act.questRoom` stays; `act.questBoardId` goes.** The room id is
   independently load-bearing (act3's "settle debt" action), so
   renaming or removing it would touch unrelated systems for no
   benefit. `questBoardId` has no reader left once the payload
   construction is gone.
6. **GAME_STATE_VERSION bump + migration hop**, mirroring Phase 52e's
   rest-retirement precedent exactly (a mobile-only slice key is not a
   formal `GameState` field, so the hop is untyped over the raw
   payload).

## Empty / loading / error states

None new. No screen is left dangling — `/quest` route + gate are both
gone together, so there's no path that could reach a since-deleted
screen.

## Pages × tests matrix

| Surface | Test |
|---|---|
| fv-15 resolves to `encounter` (foot-stealer) | `axiomancer-mechanics/src/World/MapEvents/e2e/content.engine.test.ts` |
| Fishing-village kind census (no `quest`, encounter 4) | same file + `content-parity.engine.test.ts` + mobile `map-encounter-minigames.engine.test.ts` |
| Labyrinth ledger rooms narrate, don't crash | existing `Labyrinth/e2e/labyrinth.engine.test.ts` coverage (unchanged assertions, now exercising the narration path) |
| v17→v18 save migration clears a stale quest session | `axiomancer-mechanics/src/Game/e2e/quest-board-retirement-migration.engine.test.ts` (new) |
| Minigame harness runs hazard+gathering only | `axiomancer-mechanics/src/World/e2e/minigame-harness.engine.test.ts` |
| No `/quest` route reachable; debug triggers gone | `axiomancer-mobile/components/__tests__/{DebugTriggerEncounter,DebugEncounterButtons}.test.tsx` |

## Verify gate

`npm run verify --workspace axiomancer-mechanics` and
`npm run verify --workspace axiomancer-mobile` — both green (mechanics:
203 test files / 2837 tests; mobile: 264 test files / 2750 tests).

## Commit body template

```
feat(world): retire the Quest Board minigame — phase 61

- delete World/QuestBoard/ entire, its CLI driver + npm script, the
  quest-board-tuning skill/workflow, and the harness's questBoard arm
- remove the `quest` MapEventKind end-to-end (types/handlers/content,
  mobile actions/store/presenters/components/routes)
- fv-15 (fishing-village) rejoins the encounter roster as foot-stealer,
  an orphaned Phase-60 foe at the right level for its pre-boss column
- fix a latent crash: the Labyrinth's three pre-boss "ledger" rooms
  referenced quest-board ids that were never registered; they now
  narrate the Sophist's own scripted line instead
- GAME_STATE_VERSION 17->18: clears a stale mobile-only quest session
  from old saves
- QuestLog (quest.engine.ts/quest.library.ts, the Memoir quest section,
  Old Marrow's quest-giver dialogue) is untouched — different system,
  same word

Decisions:
- fv-15 -> encounter (reverses the very displacement pattern Phase
  53c/60 established) over leaving a throw
- Labyrinth ledger rooms narrate via the existing room.narration
  pattern rather than getting new authored content
- act.questRoom kept (still gates an unrelated act3 mechanic);
  act.questBoardId dropped (dead once the payload is gone)

Closes #<phase-issue-number>
```

## DoD

- [x] `World/QuestBoard/` and every wiring point (CLI, harness, mobile
      actions/store/presenters/components/routes) deleted.
- [x] fv-15 resolves to `encounter`; fishing-village's kind census
      updated across all touched test files.
- [x] The Labyrinth's three ledger rooms no longer construct a `quest`
      payload; no test regression.
- [x] `GAME_STATE_VERSION` bumped with a hermetic migration test.
- [x] `npm run verify` green on both touched workspaces.

## Follow-ups (out of scope)

- None identified — the deletion is self-contained. (The QuestLog
  itself, `Phase 53c`'s quest-giver, and `Phase 76`'s Gathering
  retirement are separate rows.)
