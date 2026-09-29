# Goal — save-load walkthrough

**Surface under test:** the Phase 27 unit 2 Save / Load CLI tabs +
the `--save-file <path>` flag, which together expose the engine's
persistence layer (`src/Game/persistence/node.adapter.ts`) as a
user-facing save-slot. After Phase 31 (`711b49e`) `resolveMapEvent`
also unlocks adjacents into `availableNodes`, so the walkthrough can
exercise a proper save → mutate-past-save → load → rollback cycle
across two map nodes.

The walkthrough boots on the Breakwater, moves to `bw-4` (a gathering),
writes a snapshot at `bw-4`, moves to `bw-5` (a loot cache, newly
reachable post-Phase-31), then loads to roll the position back to
`bw-4`. It walked fishing-village's `fv-2` → `fv-3` until that map was
purged (R3b); R3c re-pointed it.

This walkthrough requires the CLI to be invoked with `--save-file
<path>`. The `automation/agent-e2e.mjs` harness allocates a temp
snapshot path for every run and passes the flag through, so the test
works end-to-end with no extra setup.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap starts the run at `bw-1`.
2. A `moveToNode` record fires with `event.target === 'bw-4'`,
   followed by a `resolveMapEvent` whose event is a `gathering`.
   `world.currentMap.currentNode` is `'bw-4'` after this step.
3. A `save` state-log record fires next; its
   `before.world.currentMap.currentNode` is `'bw-4'` (the snapshot
   point). A `game:saved` event also appears on the JSON event
   stream.
4. A second `moveToNode` record fires with `event.target === 'bw-5'`
   (reachable because Phase 31's `unlockAdjacent` moved it into
   `availableNodes` when bw-4 resolved). A second `resolveMapEvent`
   follows, with kind `'loot-cache'`.
5. A `load` state-log record fires next. Its
   `before.world.currentMap.currentNode` is `'bw-5'` (the post-move
   position), and its `after.world.currentMap.currentNode` is
   `'bw-4'` (the snapshot position). A `game:loaded` event also
   appears on the JSON event stream.
6. The session exits cleanly via `quit` (`cli:exit` reason `'quit'`).

**Fail conditions:**

- The second `moveToNode` to `bw-5` is rejected (would mean Phase
  31's `unlockAdjacent` regressed; agent will see the CLI log "No
  adjacent nodes are open right now" instead of the move).
- No `save` or `load` record appears (the Phase 27 unit 2 CLI tabs
  didn't fire).
- The `load` record's `after.world.currentMap.currentNode` does NOT
  match `'bw-4'` (load is broken, or the autosave path is
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
- bw-4 (gathering) and bw-5 (loot cache) are both non-encounter
  content, so combat never starts and the rollback semantics stay
  clean.
