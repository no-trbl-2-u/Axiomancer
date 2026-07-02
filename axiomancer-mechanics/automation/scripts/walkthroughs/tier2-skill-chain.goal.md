# Goal — tier2-skill-chain walkthrough

**Surface under test:** Tier 2 skill cast in combat with **two-effect
compound application** under the Phase 80 always-land contract. The
walkthrough boots the Wanderer preset (level 8, T1 + T2-original
skills known + pre-equipped including `eternal-regress`), debug-spawns
a Wet Hound (Tier 1 enemy — low-stakes target), drives 2 basic rounds
to accumulate heart + mind tokens, then casts **`eternal-regress`**
(Tier 2, basePower 6 heart, cost heart 2 + mind 2). The skill applies
two effects in one cast — `debuff_confusion` + `debuff_slow` — both
on the opponent.

The walkthrough's value:
1. **Tier 2 skill dispatch** through `executeSkill` (Phase 26 wire-up).
2. **Two-effect compound application** — the Phase 78 audit MED row
   flagged this as a zero-coverage primitive; this walkthrough is the
   first player-experience-tier exercise of the both-effects-land
   contract.
3. **Phase 80 always-land contract** — both effects land
   unconditionally post-Phase-80 (Tier 2 debuff target-resist roll
   removed). This walkthrough is the first walkthrough authored
   under the new contract.

**Originally scoped for Phase 66 synergy** per the Phase 81 candidate
body, but per the brief D2 — none of the 5 Phase 66 synergy skills
ship in any preset's `knownSkills`. Exercising
them would require either preset extension or Learn + Equip
workflow; pivoted to `eternal-regress` per D2.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. **Bootstrap** records the Wanderer preset (level 8, baseStats
   `{ heart: 5, body: 4, mind: 4 }`, `knownSkills.length === 9`,
   `knownSkills` includes `eternal-regress`).

2. **Debug-spawn** records a Wet Hound entry — state log shows a
   `debugSpawn` action with `event.slug === 'wet-hound'` and
   `event.enemyName === 'Wet Hound'`.

3. **Two basic rounds** record `combatRound` entries with
   `event.playerAction.action === 'attack'` — first body stance,
   then heart stance. These build up tokens (per Spec 04
   `RESOURCE_GENERATION`: ATTACK_HIT=3, ATTACK_MISS=1, DEFEND=5).
   Even on miss the token gain is positive.

4. **Skill cast** — a `combatRound` entry exists with
   `event.playerAction.action === 'skill'` and
   `event.playerAction.skillId === 'eternal-regress'`. Stance is
   `'mind'` at cast time (heart 2 + mind 2 cost is paid; the heart
   stance from round 2 generates heart tokens; the mind stance at
   round 3 generates the final mind token needed).

5. **Two effects applied to the opponent.** Per the Phase 80
   always-land contract, both `debuff_confusion` AND `debuff_slow`
   land on the Wet Hound. The state log shows effect-application
   events (skill-phase / effect-applied) for both effects. **The
   per-effect resistance roll is gone post-Phase-80** — there's no
   "effect resisted" event for either effect.

6. **Combat resolution** — combat either ends via `combat:ended`
   (victory likely; Wet Hound is a Tier 1 enemy with low HP) or
   the script exhausts the trailing 3 basic-attack rounds. Either
   acceptable.

7. **Session exit** — `cli:exit` reason `'quit'` or
   `'scriptExhausted'`.

**Fail conditions:**

- Skill cast fails with "insufficient resources" — would indicate
  the resource accumulation logic over 2 basic rounds didn't match
  the Spec 04 `RESOURCE_GENERATION` table (likely a regression on
  the Phase 77 audit-cleared token-economy path).
- Only one of `debuff_confusion` / `debuff_slow` lands — would
  indicate a regression on the two-effect compound application
  path (the Phase 78 MED row was filed exactly to surface this
  invariant).
- A `buff-fumbled` event fires for either effect — would
  indicate a regression; post-Phase-80 debuffs always land so
  `buff-fumbled` should only fire on Tier 2 buff caster fumble
  (Phase 84 renamed `effect-resisted` → `buff-fumbled` and removed
  the dead `effect-rebounded` variant).

**Diagnostic notes for the agent:**

- Wet Hound is chosen as the target because it's the lowest-HP
  authored enemy in the library (Tier 1, level 2) — Wanderer can
  defeat it in a few attacks AND the walkthrough script can finish
  cleanly. A sandbag target would also work; the wet-hound slug is
  used by `skills-in-combat.json` so the pattern is established.
- The walkthrough deliberately uses different stances per round to
  exercise the stance-token-generation logic (Phase 77 audit-cleared).
  Stance variance is the easiest way to verify the token economy is
  load-bearing.
- The hermetic coverage for the two-effect compound application
  ships at Phase 83 (post-Phase-80 effect-application test sweep)
  as part of its broader re-authoring scope. This walkthrough is
  the player-experience-tier complement.
- Per Phase 80 D2 (Phase 79 D8 carry-over), Tier 2 buff caster
  fumble/crit is KEPT. This walkthrough exercises a Tier 2 debuff
  (eternal-regress applies two debuffs), so the fumble/crit path
  doesn't fire. To exercise the Tier 2 buff path, a follow-up
  walkthrough casting a Tier 2 buff-tagged skill (mob-appeal's
  secondary_heal_self via the special-mechanic dispatch) would be
  needed.
- Per the Phase 81 D6 follow-up: once the preset is extended to
  include the 5 Phase 66 synergy skills, a dedicated
  `synergy-skills-chain` walkthrough ships separately.
