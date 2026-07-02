# Goal — save-load walkthrough

**Surface under test:** the Phase 27 unit 2 Save / Load CLI tabs +
the `--save-file <path>` flag, which together expose the engine's
persistence layer (`src/Game/persistence/node.adapter.ts`) as a
user-facing save-slot. After Phase 31 (`711b49e`) `resolveMapEvent`
also unlocks adjacents into `availableNodes`, so the walkthrough can
now exercise a proper save → mutate-past-save → load → rollback
cycle across two map nodes.

The walkthrough boots the Apprentice preset, moves to `fv-2` (Old
Marrow interaction), writes a snapshot at `fv-2`, moves to `fv-3`
(village — newly reachable post-Phase-31), then loads to roll the
position back to `fv-2`.

This walkthrough requires the CLI to be invoked with `--save-file
<path>`. The `automation/agent-e2e.mjs` harness allocates a temp
snapshot path for every run and passes the flag through, so the test
works end-to-end with no extra setup.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap records the Apprentice preset (level 1, base stats from
   `apprenticePreset`, starting at `fv-1`).
2. A `moveToNode` record fires with `event.target === 'fv-2'`,
   followed by a `resolveMapEvent` whose event is an `interaction`
   (Old Marrow at fv-2). `world.currentMap.currentNode` is `'fv-2'`
   after this step.
3. A `save` state-log record fires next; its
   `before.world.currentMap.currentNode` is `'fv-2'` (the snapshot
   point). A `game:saved` event also appears on the JSON event
   stream.
4. A second `moveToNode` record fires with `event.target === 'fv-3'`
   (now reachable because Phase 31's `unlockAdjacent` moved fv-3
   from `lockedNodes` into `availableNodes` when fv-2 resolved). A
   second `resolveMapEvent` follows, with kind `'village'` (fv-3
   hosts fvShop).
5. A `load` state-log record fires next. Its
   `before.world.currentMap.currentNode` is `'fv-3'` (the post-move
   position), and its `after.world.currentMap.currentNode` is
   `'fv-2'` (the snapshot position). A `game:loaded` event also
   appears on the JSON event stream.
6. The session exits cleanly via `quit` (`cli:exit` reason `'quit'`).

**Fail conditions:**

- The second `moveToNode` to `fv-3` is rejected (would mean Phase
  31's `unlockAdjacent` regressed; agent will see the CLI log "No
  adjacent nodes are open right now" instead of the move).
- No `save` or `load` record appears (the Phase 27 unit 2 CLI tabs
  didn't fire).
- The `load` record's `after.world.currentMap.currentNode` does NOT
  match `'fv-2'` (load is broken, or the autosave path is
  overwriting the snapshot slot).
- A `save` record contains `event.result === 'no-slot'` (the
  walkthrough was run without `--save-file`).
- The CLI exited with `reason: 'error'` for any reason other than
  script exhaustion.

**Diagnostic notes for the agent:**

- The Save tab and Load tab use a dedicated snapshot adapter pointed
  at `--save-file`. The store itself uses `nullAdapter` so the
  dispatch-time autosave path does NOT overwrite the snapshot slot —
  this is what makes the Load tab a real rollback, not a re-read of
  the latest dispatch.
- Phase 31 (`711b49e`) added `unlockAdjacent(map, nodeId)` next to
  `revealAdjacent`; `resolveMapEvent` calls both so the just-resolved
  node's adjacents enter `availableNodes` (the CLI's filter), not
  just `discoveredNodes`. Without that fix, the apprentice would be
  stuck at fv-2 — the legacy state of this walkthrough used to test
  exactly that limitation by saving at fv-1 and moving to fv-2 only.
- fv-2 (Old Marrow, interaction) and fv-3 (fvShop, village) are
  both non-encounter, so combat never starts and the rollback
  semantics stay clean. fv-4 hosts a wet-hound encounter — the
  walkthrough deliberately stops before that.
