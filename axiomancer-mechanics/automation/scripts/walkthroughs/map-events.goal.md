# Goal — map-events walkthrough

**Surface under test:** the Map tab + `resolveMapEvent` dispatcher
(Spec 23 / Phase 24).

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap with Apprentice preset succeeds (state log `tick: 1`
   action `bootstrap`).
2. The Map tab fires a move to `fv-2` (state log records a
   `moveToNode` entry with `target: 'fv-2'`).
3. The next state-log record is a `resolveMapEvent` action whose
   `event.kind` is `'interaction'` (per `src/World/MapEvents/content.ts`
   — fv-2 hosts Old Marrow).
4. The `world:moved` event AND `world:processed` event both fire on
   the JSON event stream between the move and the next prompt.
5. The session exits cleanly via `quit` (`cli:exit` reason `'quit'`).

**Fail conditions:**

- `resolveMapEvent` returns `{ kind: 'none' }` (would indicate the
  pool registry didn't auto-load the Phase 24 content).
- The world's `consumedNodes` array doesn't contain `'fv-2'` after the
  prompt (would indicate one-shot consumption isn't firing).
- The CLI exited with `reason: 'error'`.

**Diagnostic notes for the agent:**

- The Apprentice preset starts at level 1 with no equipment, so even
  if fv-2's interaction had been an encounter the player would be
  underpowered — but fv-2 is authored as an interaction, so combat
  should NOT trigger.
- The walkthrough deliberately doesn't progress past fv-2 because
  beyond that node lies fv-4 (encounter / wet-hound) which has RNG
  in the damage rolls; including it would make the walkthrough
  non-deterministic.
