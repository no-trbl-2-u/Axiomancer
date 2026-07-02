# Goal — skills-in-combat walkthrough

**Surface under test:** the Phase 26 unit 1 "skill" action in the
combat tab. The walkthrough boots the Wanderer preset (which equips
`ad-hominem-strike` among its 4 skills), debug-spawns a Wet Hound,
and fights with body-stance attacks to generate body tokens, then
fires `ad-hominem-strike` on round 2.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap records the Wanderer preset (level 8, base stats
   `5/4/4`, `knownSkills` includes `ad-hominem-strike`).
2. `debugSpawn` enters a Wet Hound encounter.
3. At least one `combatRound` state-log record has
   `event.playerAction.action === 'skill'` with
   `event.playerAction.skillId === 'ad-hominem-strike'` —
   demonstrating that the new skill action path fires from the CLI.
4. The combat round preceding the skill should be a body-stance
   attack (round 1 generates the body tokens the skill spends).
5. **Either** combat completes via a `combat:ended` event with an
   `outcome` (`victory` / `defeat` / `friendship`), **or** the
   script exhausts mid-combat with `cli:exit { reason: 'error',
   message: /script exhausted/ }`. Both are acceptable — the agent
   should grade `pass` as long as the skill action fired in any
   form during the run.

**Fail conditions:**

- No `combatRound` record contains `playerAction.action === 'skill'`
  (the new path didn't fire).
- The skill action fired but resolved to a `skill-blocked` sub-event
  (look for `SkillPhaseEvent` of kind `blocked` in the round events)
  — would indicate the affordability gate ran wrong.
- The CLI exited with `reason: 'error'` for any reason other than
  script exhaustion (would indicate an unexpected throw).

**Diagnostic notes for the agent:**

- `ad-hominem-strike` costs `3 body`. Wanderer round-1 body attack
  generates 3 body on a hit and 1 on a miss. Round-2 skill should
  fire whenever round 1 hits; if it didn't, the round-1 attack
  missed and the test path produced a skill-blocked sub-event —
  treat that as fail.
- The walkthrough deliberately overshoots combat with extra body
  attacks. If combat ends quickly, the extra answers consume tab
  prompts and the script exhausts during pickTab. The agent should
  not penalise script-exhaustion-after-victory.
