# Goal — codex-unlock walkthrough

**Surface under test:** Phase 82 CLI Codex tab + Phase 73 codex-unlock
on friendship outcome. The walkthrough boots the Apprentice preset,
drives 3 moves to the Harbor District (fv-1 → fv-11 → fv-14 → fv-15
gull crag), triggers the guaranteed MournfulGull encounter, drives
5 heart-stance defends to attempt friendship (per Phase 60 +
Phase 36 friendship-counter cap; MournfulGull has no Phase 68
`befriendabilityConfig` override, so the default both-defend cap
fires), then navigates to the **Codex tab** to verify the unlocked
entry renders.

The walkthrough's value:
1. **Phase 73 unlock path** — friendship outcome appends
   `codex-mournful-gull` to `state.codex.unlockedEntries` via the
   END_COMBAT reducer's auto-unlock branch.
2. **Phase 82 Codex tab** — read-only render of the unlocked
   entries with title + body.
3. **End-to-end demonstration** of the GH#65 ask 3 surface:
   befriend → codex.unlockedEntries → consumer renders.

Per the Phase 82 brief D3 + Phase 81 D3 — the walkthrough grades
on **either** friendship-fires-and-codex-unlocks **or**
script-exhausted-without-friendship. MournfulGull's AI may attack
rather than defend on some rounds, breaking the both-defend pattern;
the surface is still exercised (the Codex tab renders the empty
state in that case).

**Pass conditions (the agent should verify against the state log +
event stream):**

1. **Bootstrap** records the Apprentice preset (level 1, baseStats
   `{ heart: 5, body: 5, mind: 5 }`, `knownSkills.length === 6`).

2. **Three moveToNode records** in order: `fv-11` → `fv-14` →
   `fv-15` (matching the `fishing-village-exploration` walkthrough's
   Harbor District spine).

3. **Encounter at fv-15** — state log records `resolveMapEvent`
   with `event.kind === 'encounter'` + `event.enemySlug ===
   'mournful-gull'`; `combat:started` event fires.

4. **At least five combatRound records** with consistent
   `event.playerAction.action === 'defend'` +
   `event.playerAction.stance === 'heart'`.

5. **Codex tab access** — state log records the tab transition to
   `'codex'`; the CLI output includes either:
   - **Friendship-fired path** — the "Catalogue of Slights" title +
     body for `codex-mournful-gull`. `state.codex.unlockedEntries`
     contains `'codex-mournful-gull'`. A `combat:ended` event with
     `outcome === 'friendship'` fires earlier in the stream + the
     report carries `friendshipReward.codexEntryUnlocked` with
     `{ id: 'codex-mournful-gull', title: 'The Catalogue of Slights' }`.
   - **Script-exhausted path** — the empty-state copy: "Your codex
     is empty — befriend a foe with a journal entry to start
     filling it." `state.codex.unlockedEntries.length === 0`. The
     combat may still be in progress at script tail, OR combat
     ended via victory/defeat without friendship firing.

6. **Session exit** — `cli:exit` reason `'quit'` or
   `'scriptExhausted'`.

**Fail conditions:**

- `state.codex.unlockedEntries` contains `'codex-mournful-gull'`
  BUT the Codex tab output doesn't include the title — would
  indicate `codexLookup` in `src/CLI/game.cli.ts` didn't find the
  entry (likely a regression on the EnemyLibrary walk; the entry
  ships at `enemy.library.ts:267-273`).
- `state.codex.unlockedEntries` is empty AND the Codex tab renders
  any entry — would indicate the read path is showing stale or
  cached data; `state.codex` is the canonical source.
- `combat:ended` fires with `outcome === 'friendship'` but
  `state.codex.unlockedEntries` is empty — would indicate the
  END_COMBAT reducer's auto-unlock branch regressed (Phase 73
  Unit 1, commit `0dea5f5` is the canonical pin).
- The CLI exited with `reason: 'error'` for any reason other than
  script exhaustion.

**Diagnostic notes for the agent:**

- The walkthrough builds on `fishing-village-exploration` (Phase 81)
  — same map path, same encounter trigger, same defender posture.
  The only structural difference is the additional codex-tab
  navigation step at the script tail.
- Friendship cap fires at `FRIENDSHIP_COUNTER_MAX = 3` per Phase 36.
  Both-defend rounds increment the counter; an attack round
  doesn't increment. With 5 scripted defend rounds, the friendship
  outcome is likely IF MournfulGull defends on at least 3 of those
  rounds. MournfulGull's `logic: 'balanced'` AI gives roughly a 50%
  defend rate, so the friendship outcome is plausible but not
  deterministic.
- The Phase 73 codex auto-unlock branch fires on `END_COMBAT`
  outcome `'friendship'` only (per `src/Game/store.ts` END_COMBAT
  reducer). Other outcomes (victory, defeat, flee) don't auto-unlock
  codex entries — that's the canonical contract.
- The Phase 73 `Enemy.journalEntry?` field on MournfulGull lives
  at `src/Enemy/enemy.library.ts:267-273`. The codex tab's lookup
  walks `EnemyLibrary` once at module load per Phase 82 D2 —
  no public-barrel registry export needed.
- This walkthrough is the second walkthrough (after
  `fishing-village-exploration`) that exercises the MournfulGull
  encounter. The two have **different graded surfaces**: this
  walkthrough grades on the Codex tab + the Phase 73 unlock path;
  `fishing-village-exploration` grades on the Harbor District
  traversal + the Phase 65 25-node grid wiring.
- Phase 82's Reset tab (Begin again — `store.resetRun`) is NOT
  exercised here. A separate walkthrough (e.g. `reset-run`) would
  ship in a future iterate tick; the surface is hermetically covered
  by `src/Game/e2e/run-loop.engine.test.ts` (Phase 72 Unit 3).
