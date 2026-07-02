# Goal — item-use walkthrough

**Surface under test:** the in-combat `item` action (Spec 05b's
consumable path through `resolveCombatRound`'s scenario phase). The
walkthrough boots the Wanderer preset (carries 5 healing-potions),
debug-spawns a Sandbag, takes a handful of body-attack rounds to
accumulate chip damage, fires a healing-potion via `action: 'item'`,
then resumes attacks until combat ends.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap records the Wanderer preset (level 8, base stats
   `5/4/4`, inventory includes 5 healing-potions).
2. `debugSpawn` enters a Sandbag encounter (state log `debugSpawn`
   action with `event.slug === 'sandbag'`).
3. At least one `combatRound` state-log record has
   `event.playerAction.action === 'item'` with
   `event.playerAction.itemId === 'healing-potion'` — proving the
   new item action path fires from the CLI.
4. On that same `combatRound` record, **either**:
   - `after.combat.player.health > before.combat.player.health` (HP
     rose; the exact rise is clamped at maxHealth so it may be less
     than the healing-potion's `healAmount` of 20), **OR**
   - the healing-potion quantity in `after.combat.player.inventory`
     is one less than in `before.combat.player.inventory` (proving
     the item was consumed even if HP was at cap).
   Either is sufficient: both demonstrate the consumable resolved.
5. **Either** combat completes via a `combat:ended` event (outcome
   `victory` is expected since wanderer is level 8 and sandbag is a
   passive dummy with 100 HP), **or** the script exhausts mid-fight
   with `cli:exit { reason: 'error', message: /script exhausted/ }`.
   Both are acceptable as long as the item action fired.

**Fail conditions:**

- No `combatRound` record contains `playerAction.action === 'item'`
  (the new path didn't fire — likely the CLI's `chooseCombatAction`
  doesn't offer the item choice when the player has consumables).
- The item action fired but resolved to an `item-blocked` sub-event
  (look for `{ phase: 'item', kind: 'blocked', reason: ... }` —
  would indicate `chooseCombatAction` shipped a malformed payload
  to the resolver).
- The CLI exited with `reason: 'error'` for any reason other than
  script exhaustion.

**Diagnostic notes for the agent:**

- The Sandbag (level 10, body 1, logic 'random') deals minimal
  damage per round. Wanderer's HP only drops ~5 across the leading
  5 rounds — so the healing-potion's `healed` field will likely
  read as a single-digit number, not 20, because of the maxHealth
  clamp. The inventory decrement (5 → 4) is the cleanest evidence.
- The walkthrough budgets 11 trailing attacks (16 rounds total)
  to ensure combat ends in victory before the script exhausts.
- The state log's top-level `state.player.health` does NOT track
  in-combat HP — only `state.combat.player.health` does. The agent
  should read the nested combat-state fields when verifying HP rise.
