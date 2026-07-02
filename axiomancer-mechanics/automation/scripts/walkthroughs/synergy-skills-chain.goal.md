# Goal — synergy-skills-chain walkthrough

**Surface under test:** Phase 66 Tier 2 synergy skill `resonance-burst` 
casting with predicate match through the CLI/scripted walkthrough path. 
The walkthrough boots the Wanderer preset (extended with Phase 66 synergy 
skills), debug-spawns a Wet Hound, establishes the `debuff_confusion` 
predicate state via `eternal-regress`, then fires `resonance-burst` which 
synergizes with the existing confusion debuff.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. **Bootstrap** records the Wanderer preset (level 8, baseStats 
   `{ heart: 5, body: 4, mind: 4 }`, `knownSkills` includes both 
   `eternal-regress` and `resonance-burst`).

2. **Debug-spawn** enters a Wet Hound encounter — state log shows a 
   `debugSpawn` action with `event.slug === 'wet-hound'` and 
   `event.enemyName === 'Wet Hound'`.

3. **Resource accumulation** — first two rounds of heart + mind attacks 
   generate enough tokens for `eternal-regress` cost (heart 2 + mind 2).

4. **Predicate setup** — `eternal-regress` cast produces a `combatRound` 
   entry with `event.playerAction.action === 'skill'` and 
   `event.playerAction.skillId === 'eternal-regress'`. The round events 
   show `debuff_confusion` applied to the enemy with duration ≥ 1.

5. **Additional resource accumulation** — two more attacks (mind + heart) 
   generate tokens for `resonance-burst` cost (mind 2 + heart 1).

6. **Synergy cast** — `resonance-burst` cast shows `event.playerAction.skillId === 'resonance-burst'` 
   with the enemy still carrying `debuff_confusion` from step 4.

7. **Synergy fired event** — a `SkillEvent` / `SkillPhaseEvent` of kind 
   `synergy-fired` appears in the round events, demonstrating that the 
   synergy predicate matched and the synergy bonus fired.

8. **Combat resolution** — combat either ends via `combat:ended` 
   (victory likely) or the script exhausts the trailing 3 body-attack 
   rounds. Either acceptable.

**Fail conditions:**

- No `synergy-fired` event appears when `resonance-burst` is cast with 
  `debuff_confusion` present on the target — would indicate the synergy 
  predicate evaluation path is broken.
- The `eternal-regress` skill cast fails with "insufficient resources" — 
  would indicate the resource accumulation over 2 rounds didn't generate 
  enough tokens.
- The `resonance-burst` skill cast fails with "insufficient resources" — 
  would indicate the resource economy is off.
- Either skill resolves to a `skill-blocked` sub-event — would indicate 
  the affordability gate or skill availability is wrong.

**Diagnostic notes for the agent:**

- `eternal-regress` costs `{ heart: 2, mind: 2 }` and applies `debuff_confusion` 
  with default duration 2. The wanderer preset includes this skill.
- `resonance-burst` costs `{ mind: 2, heart: 1 }` and synergizes with 
  `debuff_confusion` on target with `durationMin: 1`, adding `bonusDamage: 3` 
  + `intensityDamageMul: 2` + `durationDamageMul: 3`, and `consumeMatched: true`.
- Per Spec 04 `RESOURCE_GENERATION`: ATTACK_HIT=3, ATTACK_MISS=1. Even on 
  misses, 4 rounds of attacks should generate enough tokens.
- The walkthrough exercises the **synergy predicate match path** specifically — 
  this is the first player-experience-tier test of Phase 66 synergy skills 
  working through the full CLI interaction chain.
- The `wet-hound` slug is reused from other walkthroughs as a known-good 
  low-HP target that allows clean completion.