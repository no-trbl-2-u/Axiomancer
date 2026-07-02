# Goal — stat-allocation walkthrough

**Surface under test:** the Phase 29 stat-allocation flow — the
`availableStatPoints` field on `Character`, the
`STAT_POINTS_PER_LEVEL = 3` grant in `applyLevelUps`, the
`allocateStatPoint(stat)` reducer, and the Character-tab UI prompt
that surfaces when `availableStatPoints > 0`. The walkthrough boots
the Sage preset (level 15), debug-spawns the Coastal Tyrant, runs
body-stance attacks until victory triggers a level-up to 16 (granting
3 stat points), then allocates all three points into `body` via the
Character tab.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap records the Sage preset (level 15, base stats `7/6/6`,
   `availableStatPoints` initialised to 0).
2. `debugSpawn` enters a Coastal Tyrant encounter.
3. Combat resolves via a `combat:ended` event with outcome
   `'victory'` (Sage at level 15 should win vs a level-7 boss within
   the 40 attack rounds budgeted).
4. A `levelUp` state-log record appears post-combat. Its
   `after.player.level` is strictly greater than `before.player.level`,
   and `after.player.availableStatPoints` is exactly
   `(after.level - before.level) * 3` (Spec 06 Q3 grant; multi-level
   cascades multiply this).
5. Exactly three `allocateStatPoint` state-log records appear, one
   per available point. Each has `event.stat === 'body'`, decrements
   `availableStatPoints` by 1, and increments
   `player.baseStats.body` by 1.
6. After the last allocation, `player.availableStatPoints` is 0 and
   `player.baseStats.body` is exactly `bootstrap.baseStats.body + 3`.
7. The session exits cleanly via `quit` (`cli:exit` reason `'quit'`).

**Fail conditions:**

- The `levelUp` record's `after.availableStatPoints` is unchanged from
  `before` (the Phase 29 unit 1 grant didn't fire).
- No `allocateStatPoint` records appear (the Character-tab prompt
  didn't surface, or didn't dispatch).
- An `allocateStatPoint` record doesn't decrement the pool or
  increment the chosen base stat (the Phase 29 unit 2 reducer is
  broken).
- The CLI exited with `reason: 'error'` for any reason other than
  script exhaustion.

**Diagnostic notes for the agent:**

- The Coastal Tyrant is a level-7 boss with body 7 / heart 6 and
  `procUnlocks` favoring body and heart. Sage at level 15 with mid-
  tier gear reliably wins via body attacks in ~30 rounds — the
  walkthrough budgets 40 to absorb bad-dice variance.
- Sage's level-up trajectory: starts at level 15 with experience
  14000 / threshold 15000. A boss kill grants 7 × 200 = 1400 XP
  (`level × DEFAULT_XP_BY_DIFFICULTY[boss]` per Spec 06 Q2). Final
  XP = 15400 ≥ 15000 → one level promotion. 15400 < 16000 → cascade
  stops after one. Net: +1 level, +3 stat points (Q3 grant).
- The Character-tab prompt loops while `availableStatPoints > 0`. The
  walkthrough provides three `{ "stat": "body" }` answers — one per
  point. A `{ "stat": "skip" }` answer is the user-side exit; the
  walkthrough doesn't use it because we want all 3 points consumed.
- HP also grows by the `maxHealth` delta on each body allocation
  (Spec 06 Q4 picked full refill for level-up only; allocation is
  the off-ramp where the player isn't given a free heal — they get
  exactly the new ceiling). Verify `after.health > before.health` on
  each body / heart allocation record.
