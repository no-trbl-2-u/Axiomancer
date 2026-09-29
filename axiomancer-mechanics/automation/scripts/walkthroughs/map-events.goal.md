# Goal — map-events walkthrough

**Surface under test:** the Map tab + `resolveMapEvent` dispatcher
(Spec 23 / Phase 24).

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap succeeds (state log `tick: 1` action `bootstrap`), on the
   Breakwater at `bw-1`.
2. The Map tab fires a move to `bw-4` (state log records a
   `moveToNode` entry with `target: 'bw-4'`).
3. The next state-log record is a `resolveMapEvent` action whose
   `event.kind` is `'gathering'` (per `src/World/MapEvents/content.ts`
   — bw-4 is a Breakwater gathering; the CLI logs "You gather ...").
4. The `world:moved` event AND `world:processed` event both fire on
   the JSON event stream between the move and the next prompt.
5. The session exits cleanly via `quit` (`cli:exit` reason `'quit'`).

**Fail conditions:**

- `resolveMapEvent` returns `{ kind: 'none' }` (would indicate the
  pool registry didn't auto-load the Phase 24 content).
- The world's `consumedNodes` array doesn't contain `'bw-4'` after the
  prompt (would indicate one-shot consumption isn't firing).
- The CLI exited with `reason: 'error'`.

**Diagnostic notes for the agent:**

- The walkthrough stops at bw-4 because its scope is the dispatcher and
  one-shot consumption, not route combat. It walked fishing-village's
  `fv-2` until that map was purged (R3b); R3c re-pointed it at the
  Breakwater. Combat witnesses belong in the route-Hazard harness, not
  this deterministic dispatcher walkthrough.
