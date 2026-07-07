# Prompt for claude-design — The Aporia labyrinth UI

> T: paste everything below the line into a claude-design session run
> against this repo. The mechanics + CLI landed first (roadmap step
> 10); this prompt hands the mobile UI over with the full engine
> surface named. Nothing in the engine should need to change — if it
> does, stop and flag it rather than duplicating rules in presenters.

---

Build the mobile UI for **The Aporia**, Axiomancer's MAZE-style
labyrinth continent, inside `axiomancer-mobile`. The engine, content,
and a playable CLI already exist in `axiomancer-mechanics` — your job
is presentation only. Read these first, in order:

1. `axiomancer-mechanics/specs/world/W-01-aporia-labyrinth-continent.md`
   — the continent contract (traversal doctrine, access rules).
2. `plan/labyrinth/DESIGN.md` sections 5-7 — the puzzle grammar, the
   center, and the UI spec this prompt implements.
3. `axiomancer-mechanics/specs/characters/C-01-the-sophist.md` — the
   narrator's voice; every line of UI copy involving him must match it.
4. `plan/labyrinth/reference/maze-book/` — two pages of the 1985 MAZE
   book (the room-scene look the design descends from).
5. `axiomancer-mechanics/src/CLI/labyrinth.cli.ts` — the headless
   reference implementation of the exact play loop you are skinning.

## Engine surface (all exported from `@mechanics`)

- Content: `APORIA_ACTS`, `getAporiaAct`, `getAporiaActByMap`,
  `getRoom` — rooms carry `display`, `name`, `scene`, `narration`,
  `pois` (label + remark + fragment/secret metadata), `doors`,
  `waystone`, `eject`.
- Traversal: `visibleDoors`, `canTraverse` (never re-derive door
  visibility client-side), `moveToNode`, `teleportToNode`,
  `unblockMapRoute` via the store's world state; first-arrival events
  resolve through the existing `resolveCurrentMapEvent` action
  (labyrinth maps are `traversal: 'labyrinth'`; solved rooms re-enter
  freely and produce `{ kind: 'none' }`).
- Puzzle verbs: `inspectPoi`, `submitGateAnswer`, `preConfirmedWords`,
  `buyHint`, `hintPrice`, `settleDebt`, `debtPoints`,
  `borrowedPremiseStacks`, `activateWaystone`, `lastWaystone`,
  `namingForkOpen`, `recordBossOutcome`.
- Progress: `GameState.labyrinth` (`LabyrinthProgress`) — pocket,
  open gates, revealed secrets, debt, waystones. Persisted with the
  save; initialize with `createLabyrinthProgress()` on first entry.

## What to build

1. **Dev-menu entry ONLY** (T's rule): character tab dev menu gains
   "THE APORIA" -> act select (act1/act2/act3) -> labyrinth screen.
   No exploration-tab presence, no story wiring.
2. **The Room Scene** — the primary view, one authored scene per room
   in the book's spirit (SVG placeholder art per the existing
   placeholder system; black-ink-on-parchment mood; the reference
   pages show the target grammar): 2-5 door POIs with the
   DESTINATION's display number on plaques (gated doors show sealed;
   unrevealed secret doors DO NOT RENDER — `visibleDoors` is the
   truth), 2-6 object POIs. Tapping an object POI shows the Sophist's
   remark (and fragment pickup / secret-door reveal when the engine
   says so). Tapping a door POI confirms then travels; arrival events
   use the existing full-screen encounter/dialogue overlays.
3. **The Accordion** (T's core idea) — collapsible panel at the
   bottom. Collapsed: display number + room name strip. Expanded: the
   Sophist's narration ("what you see"), the act riddle, the
   **Pocket** (fragments as chips, reorderable ONLY at gate/center
   socket UIs), and **Ask the Sophist** (three hint tiers with live
   `hintPrice` in real units — real-units-or-no-number rule applies).
4. **Gate / Foundation socket UI** — sockets in a row (4 / 4 / 13);
   pre-confirmed words arrive filled (`preConfirmedWords`); the player
   drags pocket chips into the rest; submit calls `submitGateAnswer`;
   refusals show the Sophist's line + a subtle Ledger-of-Assertions
   tick. Unlimited attempts, no other friction.
5. **Fog-of-war map (secondary view)** — visited rooms only; an edge
   renders only in the direction actually walked; no display numbers
   on the map (numbers live in scenes). Lay out from walk history —
   do NOT read engine grid coordinates for placement.
6. **Waystones / ejection / finale dressing** — waystone activation
   toast; the Oubliette ejection transition; the finale pre-fight
   panel showing Borrowed Premise stacks (from
   `borrowedPremiseStacks`) and the naming input when
   `namingForkOpen` (the name itself must never be displayed —
   the player types it).

## Hard rules

- No rules/state/RNG in presenters — every judgment comes from the
  `@mechanics` exports above; if something is missing, flag it
  instead of reimplementing (bearings.md hard rule 6).
- Copy canon: VITAE / STANCE inside encounters; the Sophist's voice
  per C-01 (terse, cold, old; no thee/thou; no emojis anywhere).
- AXM tokens only (no hex literals in components); player-facing
  strings in presenters / `*.copy.ts`, never hardcoded in components.
- Spoiler hygiene: never render gate answers, the passphrase, or the
  name PROTAS from content constants — they exist in engine data;
  the UI must only echo what the player has personally assembled.
- Verify gate: `npm run verify -w axiomancer-mobile` + the
  `verify:visual` smoke screens for the new screens; hermetic
  presenter tests under `state/e2e/` or `components/**/__tests__/`.
- The CLI (`npm run labyrinth`) is the behavioral reference — when in
  doubt about a flow, play it.
