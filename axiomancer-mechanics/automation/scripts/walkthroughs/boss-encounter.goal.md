# Goal — boss-encounter walkthrough

**Surface under test:** the Debug tab's `debugSpawn` action driving a
full boss combat loop through `resolveCombatRound` until
`combat:ended` fires. The walkthrough boots the Sage preset (level 15,
mid-tier kit, all skills known), debug-spawns the Coastal Tyrant
(level 7 boss, body-leaning), and runs body-stance attacks until the
fight resolves.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap records the Sage preset (level 15, base stats `7/6/6`,
   equipment includes `steel-blade` + `chain-mail`).
2. `debugSpawn` enters a Coastal Tyrant encounter (state log
   `debugSpawn` action with `event.slug === 'coastal-tyrant'` and
   `event.enemyName === 'The Coastal Tyrant'`).
3. At least one `combatRound` state-log record exists with
   `event.playerAction.action === 'attack'` and
   `event.playerAction.stance === 'body'` — confirms the player
   actually drove rounds through the resolver.
4. **Either** combat completes via a `combat:ended` event whose
   `outcome` is `'victory'` or `'defeat'` (the test verifies the
   loop *closes*, not that the player wins), **or** the script
   exhausts mid-combat with `cli:exit { reason: 'error',
   message: /script exhausted/ }`. Both are acceptable as long as
   the boss spawn and at least one round resolved.
5. The state log contains an `endCombat` record (only fires after
   the loop exits via `combat:ended`); if absent, the script
   exhausted mid-fight — still a pass per the rule above.

**Fail conditions:**

- No `debugSpawn` record appears (the debug-tab path didn't fire).
- No `combatRound` record appears (combat started but no rounds
  resolved — would indicate a regression in the combat loop driver).
- The CLI exited with `reason: 'error'` for any reason other than
  script exhaustion.

**Diagnostic notes for the agent:**

- The Coastal Tyrant is a boss-tier enemy (level 7, body 7 / heart
  6) with `procUnlocks` favoring body and heart. Sage is level 15
  with mid-tier weapons; the expected outcome is victory after a
  long body-attack grind, but the walkthrough budgets 50 rounds of
  body attacks — enough to win in most RNG paths and enough to lose
  if the dice break poorly. Either outcome is a pass.
- The walkthrough deliberately overshoots round count: if the fight
  ends before round 50, the trailing `{ stance, action }` answers
  are consumed by `pickTab` after combat closes (and either re-enter
  the debug tab — which would prompt for a slug — or get rejected),
  ultimately exhausting the script. Treat script-exhaustion-after-
  combat-ended as a pass.
- Body stance is chosen deliberately: the Tyrant's body procUnlock
  means defense scales, but Sage's level + weapon should still
  out-damage the boss's regen over a long fight.
