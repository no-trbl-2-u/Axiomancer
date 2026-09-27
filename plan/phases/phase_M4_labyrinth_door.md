# Phase M4 — The Labyrinth door (D24)

> Row: `plan/steps/01_build_plan.md` → THE MAP REVAMP. Parent brief:
> `plan/2026-09-25-map-revamp-m3.prompt.md` §2 (M4) and §3e.

## Outcome

Reaching the Lantern Deep's vault door (`ld-15`) takes the player into the
Aporia. The entry goes through `enterLabyrinthAction`'s overworld snapshot,
and leaving the Aporia puts the player back on the vault door. A save taken
inside the Aporia resumes there on load, and its way out still works.

## Why

D24 (T, 2026-09-25): the underworld's sealed vault door enters the Aporia on
arrival, with no gate. Until now the only way in was the dev menu, and the
visit was transient: a save taken inside the Aporia reloaded onto the act map
with no session and no way back to the overworld.

## Scope

1. **Engine: a `labyrinth` map-event kind.** Payload `{ kind: 'labyrinth',
   description? }`. It resolves to `{ kind: 'labyrinth', act, description? }`,
   where `act` is the durable progress's `currentAct` (act 1 on a first
   visit, the act the player left otherwise). It does not change the state.
   The host owns the swap, as the brief names `enterLabyrinthAction` as the
   path. The node is never consumed, so the door can be used again (like `travel`).
2. **Content:** `ld-15`'s loot cache becomes the Labyrinth door. The mobile
   layout's label and description follow.
3. **Durable return point:** `LabyrinthProgress.returnWorld?` (optional;
   old saves read as absent). `enterLabyrinthAction` writes the overworld
   snapshot there as well as on the session. `exitLabyrinthAction` restores
   it and clears the field. `resetRun` clears it.
4. **Resume:** `hydrateStoreWithGameState` rebuilds the session when the
   loaded world is on `labyrinth-continent` and the progress carries a
   `returnWorld`.
5. **Routing:** a `LabyrinthGate` in the root layout pushes `/labyrinth`
   when a session starts, unless the player is already there. The dev menu's
   own push goes away.

## Tests

- Engine: the `ld-15` pool resolves to `labyrinth` with the right act, leaves
  the state unchanged, and does not consume the node.
- Mobile hermetic: arrive at `ld-15`, enter act 1, exit, and land back on
  `ld-15` of the Lantern Deep. Also save inside, reload through
  `loadGameAction`, find the session rebuilt, exit, and land on `ld-15`.
- `LabyrinthGate` component test (the CacheGate pattern).

## Out of scope

- Any gate condition on the door (D24 rejected one).
- The CLI's labyrinth entry (`npm run labyrinth` stays a standalone driver).
