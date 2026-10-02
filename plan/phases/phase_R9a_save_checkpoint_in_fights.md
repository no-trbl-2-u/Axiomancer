# Phase R9a — Save checkpoint in fights

## Sources

- Part plan: [`plan/revamp/checkpoint.md`](../revamp/checkpoint.md) (R9a,
  rulings 1–3).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D58** (nothing is authored), **D47** / **D63** (the four ways
  a fight ends: victory, defeat, flee, mercy via The Open Hand), **D57** (no
  baseline). The save-ownership ruling is the `[loop-call]` AUDIT row "Two
  layers own save policy", DECIDED via `/oversight` 2026-09-23: mobile owns
  save timing.
- Canonical sibling: the arrival-debt fix (burn-day audit 2026-09-19 row
  3.1, `World/e2e/arrival-debt.engine.test.ts`): `pendingArrival` is the
  record a reload re-offers.

## Reality check (2026-10-02, `main` at `6194c200`)

- **`currentEncounter` is never saved.** `durableSlice` in
  `Game/store.ts` leaves it out on purpose (Spec 07). The T3 "mid-fight
  Continue" fix (`selectResumableFight`) only fires while the in-memory store
  still holds the encounter, so it never survives a real reload.
- **The node is settled when the prelude is rolled, not when the fight
  ends.** `resolveMapEvent` clears `pendingArrival`, marks the node consumed
  and unlocks its adjacents for an `encounter` like any other kind. Mobile's
  `moveToAction` also opens the onward edges on the move itself, whatever
  the node holds.
- **So the hole is real.** `SaveOnExit` writes on `pagehide` /
  `visibilitychange` / app background. A close during the prelude or the
  fight saves a player standing on a consumed node, with nothing owed and
  the way on open. On reload the fight is gone, and on a door node the
  Doorwarden is skipped.
- A save taken between the move and the resolve is already safe: it carries
  `pendingArrival`, and the map re-offers it on mount.

## Outcome

A fight's node is settled when the fight settles. A save taken at any point
from the arrival to the fight's end reloads onto the node, with its onward
edges closed, and the map offers the fight again from the start.

## Scope

**Engine (`axiomancer-mechanics`).**

1. `resolveMapEvent`: an `encounter` result leaves the arrival open. It does
   not clear `pendingArrival`, mark the node consumed or unlock its adjacents.
   The reveal (discovery) still runs. Every other kind is unchanged.
2. New `settleArrival(state: GameState): GameState` beside it, exported from
   the package. If `pendingArrival` names the current node, it clears the debt,
   reveals and unlocks the adjacents and marks the node consumed. Otherwise
   it returns the state unchanged (identity-stable).
3. The `END_COMBAT` reducer calls `settleArrival` for every outcome. Victory,
   friendship (mercy), flee and defeat all settle the node.
4. The CLI's two combat paths (`game.cli.ts` `resolveCurrentNodeEvent`,
   `labyrinth.cli.ts`) run their fight outside the store, so they call
   `settleArrival` once the fight returns.

**Mobile (`axiomancer-mobile`).**

5. `moveToAction` stops opening the onward edges of an encounter node.
   The engine's settle opens them. Other kinds keep opening them on the move,
   as today.
6. Both flee paths settle the arrival: `fleeEncounterAction` (WITHDRAW after
   FIGHT) and the prelude's `pickEventChoice('flee')`. Neither goes through
   `endCombat`.
7. The exploration screen's arrival effect also stands down while the store
   holds a `currentEncounter`. The in-memory resume path and the re-offer
   cannot both fire.
8. Save ownership is written down (part plan ruling 1). The mobile
   `state/store.ts` header drops "a known open question" and names the
   2026-09-23 ruling. The engine's `DURABLE_ACTIONS` header names itself as
   the engine-only (CLI/test) path. `axiomancer-mechanics/docs/gameloop.md`
   says a fight settles its node on `END_COMBAT`.
9. Stale comments that say the resolve consumes an encounter node are
   corrected (`moveToAction`, `resolveCurrentMapEventAction`,
   `EncounterModalOverlay`, `game.migrate.ts` mentions if they speak of
   encounters).

## Consumers to update

- `src/index.ts` and `World/index.ts` export `settleArrival`.
- Mobile `state/actions.ts` (move, both flees), `app/(tabs)/exploration`
  (arrival guard).
- The labyrinth reads consumed rooms as solved. A labyrinth encounter room
  is solved when its fight settles, which is the same rule.

## Save / schema contracts

No shape change and no version bump. `pendingArrival` already rides the save.
Old saves need nothing: a save taken mid-fight before this phase already lost
its fight, and nothing can rebuild it.

## Carrier sweep (D45)

None. No system loses its carrier.

## Decisions made upfront — DO NOT ASK

- **Keep the debt open; do not save the encounter.** The part plan's
  smaller shape. Persisting `currentEncounter` would need a schema bump and
  would still lose the panel-local turn state, which is out of scope.
- **The re-offer re-rolls the node's pool.** A reload resolves the arrival
  again, as Spec 07's "encounters re-roll on load" already says. Every Act 1
  encounter pool is one entry with a pinned foe and level
  (`MapEvents/content.ts`), so the fight offered again is the same fight.
- **Every outcome settles, flee included.** Today the node is consumed on
  entry, so a fled fight is never re-offered. Keeping that is the smallest
  change in player-facing rules. Defeat resets the run anyway.
- **Settle in the reducer, not in each client.** `END_COMBAT` is the one
  place every engine fight ends. Only the two flee paths, which never stage a
  fight, and the CLI, which fights outside the store, call `settleArrival`
  directly.
- **"Edges closed" means the move gate.** The node's onward neighbours stay
  out of `availableNodes`, which mobile's `moveToAction` checks, until the
  fight settles. The D1 frontier (`legalMovesFrom`, which draws the map) is
  left alone: it never depends on where the player stands, and the re-offered
  fight's modal holds the screen until the fight settles anyway (fight, or a
  flee that settles). Making the frontier depend on an owed arrival would
  rework D1 for no player-visible gain.

## Tests matrix

- Engine, added `World/e2e/fight-checkpoint.engine.test.ts`. For a normal
  Breakwater fight and for the Breakwater door, a state saved after the
  resolve (through `durableSlice`, i.e. a real save/load round trip on a
  memory adapter) reloads with `pendingArrival` on the node, the node not
  consumed and no onward node newly available. A second `resolveMapEvent`
  offers the encounter again. `endCombat` (victory, and flee) settles it:
  debt cleared, node consumed, adjacents open.
- Engine, `settleArrival` unit cases: identity when nothing is owed, and
  settles only the owed node.
- Engine, rewritten: suites that pinned "resolving an encounter consumes the
  node / unlocks adjacents / clears the debt" now settle through `endCombat`
  or `settleArrival` first (`arrival-debt`, `map-events`, the region walks,
  CLI route audits as they surface).
- Mobile, added to `state/e2e/mid-fight-resume.engine.test.tsx` (or a
  sibling): move onto an encounter node, resolve, FIGHT, save, then a fresh
  store on the same adapter. The map mounts and re-offers the fight
  (`encounter-modal` visible), and the onward nodes are not available.
- Mobile, flee: after WITHDRAW the node is consumed and the onward edges are
  open.

## Verify gate

`npm run verify --workspace axiomancer-mechanics`, then `npm run verify` (the
`@mechanics` alias couples mobile), root `npm test`, `npm run lint:content`,
`node scripts/check-lexicon.mjs`.

## Commit body template

```
feat: a fight settles its node, so a reload mid-fight re-offers it — phase R9a

- resolveMapEvent leaves an encounter's arrival open; settleArrival closes it
- END_COMBAT settles the node for every outcome; the CLI settles after its fights
- Mobile: no onward edges on an encounter node until it settles; flee settles
- Save ownership written down: mobile owns timing, DURABLE_ACTIONS is engine-only

Decisions:
- ...
```

## DoD

- A save taken mid-fight (normal and door) reloads onto the unsettled node with
  its edges closed, and the fight is offered again. Pinned in engine and mobile.
- Victory, mercy, flee and defeat each settle the node.
- Gates green; R9a ticked.

## Follow-ups (out of scope)

- Rebuilding a half-played fight's turn state on reload (part plan: out of
  scope).
- Whether `selectResumableFight` (in-memory only) still earns its keep once
  the re-offer covers reloads: R10c's truth pass or a later `/iterate`.
- The engine's `moveToNode` follows the D1 frontier, so the CLI could in
  principle walk off an owed fight. It never does, because it fights straight
  after the resolve. That stays a note unless a client needs the guard.
