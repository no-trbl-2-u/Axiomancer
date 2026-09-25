# Phase 76 — Retire the Gathering minigame ("The Gleaning")

## Outcome

"The Gleaning" — `World/Gathering/` (engine, sim, rng, content, tuning),
its CLI driver, the `gathering-tuning` skill/workflow, and the mobile
wiring (`state/gathering/`, `state/presenters/gathering.engine.ts`,
`components/gathering/`, `<GatheringGate>`, `<DebugGatheringButton>`,
`/gathering`) is deleted entirely. The `gathering` `MapEventKind` and
its 8 authored map nodes are explicitly **untouched and stay live**:
with the minigame interceptor gone, a `gathering` node now grants its
items inline (the engine resolver already does this) with **no screen
detour** — the player sees a toast, not a session.

## Problem (from `01_build_plan.md`)

**T direct, 2026-08-22:** T named Gathering among the minigames being
retired, then handed the shape of the retirement to the loop verbatim
— *"This is the type of freedom I'm trying to provide the loop. You
decide everything."* Same "two systems share a name" ambiguity as
Phase 61 (quest): (a) `World/Gathering/` is the minigame; (b)
`MapEventKind: 'gathering'` is a plain node whose payload
(`{ items: Item[]; description?: string }`) is already the
"here are your options and their effects" shape the 2026-08-10
candidate asked for. This phase retires (a), keeps (b) — the same
narrowing T ruled for quest, applied to the identically-shaped case.
`plan/PHASE_CANDIDATES.md:86-157` pre-closed this candidate
("CLOSED 2026-08-22") naming this exact scope as build-plan Phase 76.

## Scope

Both workspaces. Pure deletion + one behavior change at the
interception point (item grant goes inline instead of launching a
session) — no new UI, no new screen.

### Mechanics (`axiomancer-mechanics`)

- Deleted `src/World/Gathering/` entire (`index.ts`,
  `gathering.tuning.ts`, `gathering.engine.ts`, `gathering.types.ts`,
  `gathering.sim.ts`, `gathering.content.ts`, `gathering.rng.ts`,
  `e2e/gathering.engine.test.ts`, `e2e/gathering.balance.sim.test.ts`).
- Deleted `src/CLI/gathering.cli.ts` +
  `src/CLI/e2e/gathering.cli.engine.test.ts`; removed the `gathering`
  subcommand dispatch block in `src/CLI/game.cli.ts` and the
  `"gathering"` npm script in `package.json`. `game.cli.ts`'s
  `describeResolvedEvent`'s `case 'gathering': return \`You gather
  ${...}\`` line is UNTOUCHED — it renders the surviving kept kind's
  plain narration, not the minigame.
- Removed the `gathering-tuning` skill (`.claude/commands/`) and its
  workflow (`.github/workflows/gathering-tuning.yml`); dropped the
  Gathering clause from `AGENTS.md`'s tuning-skill roster sentence and
  both skill-list enumerations, appending `gathering-tuning` to the
  existing "already-retired skills" sentence alongside
  `rest-tuning`/`quest-board-tuning`.
- **`MapEventKind` — NO CHANGE.** `MapEvents/types.ts`'s `'gathering'`
  union member, `GatheringPayload`, and the `ResolvedEvent` gathering
  member all stay exactly as-is.
- **Resolver — NO CHANGE.** `MapEvents/handlers.ts`'s `resolveGathering`
  already grants items directly to `result.state.player.inventory` and
  returns `{ kind: 'gathering', items, description }` with no
  minigame dependency; `resolve-map-event.ts`'s
  `advanceCollectObjectives` read off `result.event.items` is
  untouched.
- `World/minigame-harness.{types,resolver}.ts`: `MinigameId` narrows
  to `'hazard'` only (the gathering arm — config/report/AB fields,
  `runGatheringHarness`/`evaluateGatheringBalance`, the sim import —
  removed, mirroring how the `quest-board` arm was removed in
  `f674c147`). The harness keeps its current shape (single-member
  union) rather than being collapsed to a non-union type — a real
  simplification pass is a separate follow-up, not this phase's job.
  `World/e2e/minigame-harness.engine.test.ts`'s gathering coverage
  (AB test, seed reproducibility, summary, overall pass/fail) is
  dropped; `World/e2e/minigame-seed-contract.engine.test.ts`'s
  `Gathering` replay-seed case is dropped.
- `test-utils/e2e/hermeticity.audit.test.ts`: the deleted CLI test's
  IO-allowlist entry removed.
- `Game/game.migrate.ts` + `game.reducer.ts`: `GAME_STATE_VERSION`
  18→19. New `migrateV18ToV19` hop clears a live gathering session
  riding along in the raw payload's mobile-only `gathering` key
  (mirrors Phase 61's `migrateV17ToV18` exactly). New hermetic
  migration test (`Game/e2e/gathering-retirement-migration.engine.test.ts`).
- Docs: `docs/encounters/gathering.md` marked HISTORICAL (the
  `quest-board.md`/`rest.md` precedent); `docs/cli.md`'s
  `gathering.cli.ts` driver section removed wholesale (pure deletion,
  matching the quest-board driver section's removal); `docs/world.md`
  — the Phase 137 "mobile host intercepts gathering / loot-cache /
  hazard" paragraph drops "The Gleaning" from the launched-minigames
  list (mirrors how the same paragraph already documents quest's
  retirement), the `npm run gathering` CLI-loop mention is dropped,
  and the entire "Gathering Balance Simulation (Phase 147)" section is
  deleted (pure minigame-sim documentation with nothing left to
  reference). The `gathering` MapEventKind payload table row, the
  eight-kinds taxonomy line, and every authored-node census mention
  (fv-8, fv-17, etc.) stay untouched — the kind and its nodes are not
  moving. `docs/testing.md`'s harness usage example updates to
  hazard-only.

### CI (`ci-e2e-scope.mjs` + workflows — bigger than the quest-board precedent)

Gathering is a first-class CI e2e suite today (quest never was); this
scope has no quest-board analog:

- `scripts/ci-e2e-scope.mjs`: drop `gathering` from the `SUITES` array,
  `emptyResult()`, the dedicated gathering regex-match block, the
  dispatch-loop entry, and the mechanics-path classifier
  (`World/Gathering/` → `markMobileSuite(..., 'gathering')`).
  `scripts/ci-e2e-scope.test.mjs`: drop its gathering-suite assertions.
- `.github/workflows/verify-mobile.yml` and
  `.github/workflows/verify-mechanics.yml`: delete the
  `Gathering playthrough (both stances)` job step
  (`steps.scope.outputs.gathering == 'true'` gate,
  `npm run e2e:gathering --workspace axiomancer-mobile`).
- `axiomancer-mobile/package.json`: delete the `"e2e:gathering"` npm
  script; delete `axiomancer-mobile/scripts/gathering-e2e.mjs`.

### Mobile (`axiomancer-mobile`)

- Deleted `state/gathering/store-actions.ts` (the slice's sole file:
  `beginGatheringAction`, `abandonGatheringAction`,
  `acknowledgeGatheringOutcomeAction`, `completeGatheringTutorialAction`,
  `claimGatheringSpoilsAction`, `continueGatheringAfterReprisalAction`,
  `descendGatheringAction`, `readGatheringSiteAction`,
  `harvestGatheringPlotAction`, `payGatheringOfferingAction`,
  `selectGatheringApproachAction`, `useGatheringToolAction`,
  `withdrawFromGatheringAction`), `app/gathering/index.tsx`,
  `state/presenters/gathering.engine.ts` (incl.
  `selectHasActiveGathering`, `selectGatheringViewModel`),
  `components/GatheringGate.tsx` (+ test),
  `components/DebugGatheringButton.tsx` (+ test), `components/gathering/`
  entire (`GatheringBoard.tsx`, `GatheringIntroOverlay.tsx` + test,
  `GatheringOverlays.tsx`, `__tests__/`), and the e2e files
  `state/e2e/gathering.flow.engine.test.ts`,
  `state/e2e/gathering.screen.test.tsx`,
  `state/e2e/gathering.tutorial.engine.test.ts`.
- `components/dev/DevToolsSections.tsx`: `DebugGatheringButton` lazy
  import + its `<DebugGatheringButton />` render removed.
- `app/_layout.tsx`: `<GatheringGate>` import + render, and the
  `app/gathering/index` stack-screen registration removed (mirrors
  `<QuestGate>`/`/quest` removal exactly).
- `state/actions.ts`:
  - The `gathering/store-actions` import block (11 action fns + 2
    types) removed.
  - The `AppActions` interface's Gathering section (12 method
    signatures) and their corresponding wiring lines removed.
  - **The interception block is rewritten, not deleted outright.**
    Today it restores the pre-event player (undoing the resolver's
    item grant) and launches a minigame session. The new version lets
    the resolver's grant stand — `resolvedState` already has the
    updated inventory — clears the event slice (no modal), and pushes
    a toast naming the gathered items via the existing `pushToast`
    helper (same helper `applyFleeCost` uses):
    ```ts
    if (result.event.kind === 'gathering') {
        store.setState({
            ...resolvedState,
            event: EMPTY_EVENT_SLICE,
        });
        const itemNames = result.event.items.map(i => i.name).join(', ');
        if (itemNames) {
            pushToast(store, `Gathered ${itemNames}.`);
        }
        return true;
    }
    ```
  - The `GATHERING_TUTORIAL_FLAG` import/constant is dropped (dead
    once the tutorial-gated `beginGatheringAction` call is gone —
    confirm no other reader first).
  - The two enumeration comments mentioning "gathering" among
    consumable / auto-resolve kinds stay — that mechanism (node
    consumption) is orthogonal to the minigame and still applies.
- `state/store.ts`: `GatheringSessionState` import, `MobileGatheringSlice`
  interface, its `gathering` field on `AppStoreState`,
  `EMPTY_GATHERING_SLICE`, and the initial-state assignment all removed.
- `state/presenters/navigation.engine.ts`: `selectHasActiveGathering`
  import and its `selectHasAnyActiveSession` disjunct removed.
- **`state/presenters/exploration.engine.ts` — NO CHANGE.**
  `KIND_TO_NODE_TYPE`'s `gathering: 'gather'` entry (and the
  `ACTION_ICON_BY_TYPE`/`ACTION_TAG_BY_TYPE` `gather` glyph/tag it
  feeds) stays: this maps the *unfired* node's authored kind to its
  on-map icon, unrelated to whether a minigame exists. Unlike quest
  (whose kind vanished), gathering's kind survives, so this switch arm
  is not touched.
- `state/presenters/event.engine.ts` / `event-assets.ts`: **NO
  CHANGE.** `gathering` stays listed among the "dead-end kinds" in
  `composeNarrative`'s switch and `DEFAULT_BODY_BY_KIND` / art-slug
  maps — it still never reaches the event modal, because the rewritten
  interceptor above still intercepts it (just without launching a
  session). The existing dead-end-kinds comment block is updated to
  drop "The Gleaning" from its enumeration of what used to launch
  there, same as the CLI/docs mentions.
- `state/minigame-seeds.ts`: `'gathering'` dropped from
  `MinigameSeedKey`; the gathering-only `siteId`/`site` fields dropped
  from `MinigameSeedEntry` (confirmed unused by any other key).
- `components/DebugTriggerEncounter.tsx`: the `'gather'` debug-trigger
  case is rewritten (not deleted — `'gather'` stays a valid debug
  trigger since the node kind is still live) to grant the same seeded
  item set inline via `resolveMapEvent`'s normal path instead of
  calling `actions.beginGathering({})`; doc comment updated to drop
  the `<GatheringGate>` mention.
- `components/DebugEncounterButtons.tsx`: no change (confirmed no
  gathering references exist there).
- `state/e2e/map-encounter-minigames.engine.test.ts`: the
  `'gather node opens "The Gleaning", not a paced /event'` test is
  rewritten to assert the new behavior — the node grants items inline
  (`selectHasActiveGathering` is gone; assert the player's inventory
  gained the payload items and `selectHasActiveEvent` stays false).
  The fishing-village kind-census assertion (`count('gathering') >=
  1`) is unchanged — no node reassignment, unlike fv-15.
- `state/__tests__/minigame-seeds.test.ts` and
  `state/e2e/minigame-seeds.engine.test.ts`: the gathering-keyed test
  cases dropped, mirroring the quest arm's removal in `f674c147`.
- `design/encounters/gathering.md` marked HISTORICAL;
  `README.md`'s `gathering/` route-table row removed.

## Player-visible impact

- Stepping onto any of the 8 authored `gathering` nodes now grants the
  node's items straight to inventory and shows a toast ("Gathered:
  ...") — no session, no screen, no tutorial coach overlay. The node
  still consumes on first visit like it always has.
- No route in the game opens `/gathering`. The dev-tools gathering
  debug button is gone; the debug-trigger's `'gather'` case still
  exists but now grants items inline instead of launching a session.
- The Memoir / QuestLog / everything else is unaffected.

## Decisions made upfront — DO NOT ASK

1. **Grant stands; interceptor rewritten, not deleted.** The resolver
   already puts the granted items on `resolvedState.player.inventory`
   — the old code path actively undid that (`player: gameState.player`)
   before relaunching the minigame with its own grant. Once the
   minigame is gone, undoing the resolver's grant and never
   re-granting it would silently eat the items. Letting the resolver's
   grant stand is correct and matches the build-plan row's explicit
   text: "the node grants its items inline with no screen detour."
2. **Toast, not silence, not a screen.** `event.engine.ts`'s `'none'`
   kind proves fully-silent auto-resolve is a real precedent in this
   codebase, but item grants deserve *some* feedback (existing
   precedent: `ToastHost`'s generic "Picked up X." for any
   `inventory:changed` event). Rather than wire a new
   `inventory:changed` emission through the non-store `addItem` path
   engine-side (out of scope — the engine's plain-object mutation
   doesn't go through `store.addItem()`), reuse the mobile-local
   `pushToast` helper already used by `applyFleeCost` — same shape,
   zero new plumbing, and it fires exactly once per gathering
   resolution.
3. **`event.engine.ts`/`event-assets.ts` stay in the dead-end-kind
   camp.** `rest` (Phase 52e's closest precedent) proved a
   minigame-retired-but-kind-kept case doesn't have to mean "now
   displays like `village`" — rest kept its own (lighter) screen.
   Gathering's build-plan text is explicit that it wants *less* UI
   than rest, not more, so the dead-end/no-modal shape is the
   correct target, just routed to a toast instead of a session.
4. **`'gather'` debug-trigger case rewritten, not removed.** The
   `MapEventKind` and its debug-trigger enum member are both still
   live; only the minigame launch inside the case goes away.
5. **Harness collapses to a `'hazard'`-only union, not further
   restructured.** Reworking `MinigameId` into a non-union type once
   only one member remains is a real simplification but out of this
   phase's scope (pure deletion, per §"Scope"); noted as a follow-up.
6. **GAME_STATE_VERSION bump + migration hop**, mirroring Phase 61's
   `migrateV17ToV18` precedent exactly.
7. **CI suite (`ci-e2e-scope.mjs` + 2 workflow steps + npm script)
   deleted outright**, not folded into the `encounters` suite. Nothing
   gathering-specific needs its own e2e coverage anymore once the node
   grants inline through the same `resolveMapEvent` path every other
   plain-grant kind already uses; ordinary `encounters` suite coverage
   (which already exercises `resolveMapEvent`) is sufficient.

## Empty / loading / error states

None new. No screen is left dangling — `/gathering` route + gate are
both gone together. The toast follows the existing `ToastHost`
auto-clear behavior (3s TTL) already proven for inventory pickups.

## Pages × tests matrix

| Surface | Test |
|---|---|
| `gathering` node grants items inline, no session, toast fires | `axiomancer-mobile/state/e2e/map-encounter-minigames.engine.test.ts` (rewritten) |
| Fishing-village / other maps' gathering kind census unchanged | same file + `content-parity.engine.test.ts` |
| `'gather'` debug trigger grants inline | `axiomancer-mobile/components/__tests__/DebugTriggerEncounter.test.tsx` |
| v18→v19 save migration clears a stale gathering session | `axiomancer-mechanics/src/Game/e2e/gathering-retirement-migration.engine.test.ts` (new) |
| Minigame harness runs hazard only | `axiomancer-mechanics/src/World/e2e/minigame-harness.engine.test.ts` |
| No `/gathering` route reachable; debug button gone | `axiomancer-mobile/components/__tests__/DevToolsSections.test.tsx` (if present) or render smoke coverage |
| CI scope no longer routes a gathering suite | `axiomancer-mobile/scripts/ci-e2e-scope.test.mjs` |

## Verify gate

`npm run verify --workspace axiomancer-mechanics` and
`npm run verify --workspace axiomancer-mobile` — both green.

## Commit body template

```
feat(world): retire the Gathering minigame — phase 76

- delete World/Gathering/ entire, its CLI driver + npm script, the
  gathering-tuning skill/workflow, and the harness's gathering arm
- delete the mobile gathering slice/screen/components/debug button;
  the `gathering` MapEventKind interceptor now lets the resolver's
  item grant stand and shows a toast instead of launching a session
- gathering MapEventKind, its resolver, and all 8 authored map nodes
  are untouched — the node still consumes on first visit, grants its
  items, no screen detour
- drop the dedicated `gathering` CI e2e suite (scope script + 2
  workflow steps + npm script) — ordinary encounters coverage now
  exercises the same resolveMapEvent path
- GAME_STATE_VERSION 18->19: clears a stale mobile-only gathering
  session from old saves

Decisions:
- resolver's item grant stands (no reversal) instead of being undone
  and never re-granted, per the build-plan row's explicit "no screen
  detour" text
- toast via the existing pushToast helper (applyFleeCost precedent)
  rather than wiring a new engine-side inventory:changed emission
- 'gather' debug-trigger case rewritten to grant inline, not removed
  (the node kind + trigger enum both stay live)

Closes #<phase-issue-number>
```

## DoD

- [x] `World/Gathering/` and every wiring point (CLI, harness, mobile
      actions/store/presenters/components/routes, CI scope + workflows)
      deleted.
- [x] `gathering` node resolution grants items inline with a toast; no
      test regression on fishing-village or other maps' kind census.
- [x] `GAME_STATE_VERSION` bumped with a hermetic migration test.
- [x] `npm run verify` green on both touched workspaces.

## Follow-ups (out of scope)

- Collapsing `MinigameId`/the harness away from a union type now that
  only `'hazard'` remains — real simplification, not required by this
  deletion.
- Phase 63's loot-cache three-way-choice rework (separate row) is the
  next minigame-shape change in this family; not touched here.
