# Phase 107 — Roster-wide difficulty tuning via Phase 104 probes

## Outcome

Tune Axiomancer combat parameters against repeatable playtest evidence until **every current playtest strategy** reaches approximately **70% win rate** without hiding broken skill/resource/status-effect systems behind stat changes. Combat is fundamentally status-effect-centered: basic attacking or pure friendliness may sometimes work, but players who ignore skills and status planning should face the harder road.

This phase intentionally runs **before** a formal difficulty-curve doctrine spec. Doctrine follows measured battlefield truth.

## Source decision

T direct decision, 2026-06-02:

- Promote roster-wide difficulty tuning before writing the doctrine spec.
- Use a fix → playthrough → fix → playthrough loop.
- Before tuning, verify token resource generation, skill casting, and status-effect behavior are functioning correctly.
- Only then adjust content/balance parameters.
- Call the phase successful only when **every current strategy** reaches approximately 70% win rate, with evidence for AGGRESSIVE, DEFENSIVE, MIXED, and STRATEGIST play styles.
- Treat STRATEGIST — skill/status-effect planning — as the witness for the intended mastery path.

## Preflight — must pass before tuning

Before changing encounter/player numbers, prove the combat machinery is trustworthy:

1. **Token resource generation works.**
   - Basic attack/defend actions grant the expected stance resources.
   - Equipment/set resource-generation bonuses still chain correctly.
   - Resource events in playtest reports reflect actual state changes.
2. **Skills work.**
   - Known/unlocked skills are available without an equipped-skill gate.
   - Only affordable unlocked skills are offered/cast by consumers.
   - `canUseSkill`, `spendResources`, `executeSkill`, skill effects, skill damage, and skill-use report metrics agree.
3. **Status effects work.**
   - Skill-applied buffs/debuffs land under the Phase 80 always-land contract where applicable.
   - Tick/expiry/stat-modifier behavior matches docs/tests.
   - Playtest outcomes are not being distorted by dead or invisible status effects.

If preflight finds a real engine bug, fix that bug first and rerun the preflight before tuning parameters.

## The loop

Repeat until every current strategy in the roster-wide report reaches approximately **70% win rate** and no dominant pathological policy remains. Required play styles are **AGGRESSIVE**, **DEFENSIVE**, **MIXED**, and **STRATEGIST**; any additional harness policy must either meet the target or be explicitly retired:

1. **Adjust parameters.** Prefer smallest-change-first changes to authored parameters:
   - enemy stats / level
   - player stats / level
   - player equipment
   - player skills
2. **Playtest.** Run the Phase 104 probes plus the relevant roster scenario(s), including the late-game Coastal Tyrant report while it remains the red signal.
3. **Read the evidence.** Use win/defeat/friendship/timeout rates, policy summaries, rounds-to-resolve, skill use, resource events, item use, and stance/action distributions to decide the next adjustment.
4. **Repeat.** Keep commits small enough that each tuning change can be explained by the prior report.

## Mechanics-change proposal — Befriend as heart skill

T's current friendship doctrine is recorded in `docs/adr/ADR-0007-befriend-is-heart-skill-with-mercy-choice.md` and company CDR-0005. The intended direction is not to fix Coastal Tyrant by merely lowering an HP threshold. Keep HP pressure, but make Befriend an explicit heart-based skill every player starts with, requiring 5 heart tokens to attempt. A successful Befriend opens a consequential choice: spare/befriend the encounter, or exploit the opening for a free guaranteed critical attack. Mechanics owns the CLI choice; Mobile owns the modal consumer once engine truth exists.

Phase 107 should treat this as the leading mechanics-change proposal if parameter tuning cannot make STRATEGIST/friendship viable. The proposal still requires implementation details before code: whether the 5 heart is spent or only held, whether failed attempts consume tokens, how status effects modify success/eligibility, and what alignment/content consequences fire for spare vs exploit.

## Stop condition — mechanics discussion required

Do **not** silently change core mechanics if parameter tuning cannot reach the target. Stop and ask T before adjusting rules such as:

- friendship eligibility semantics
- token generation formulae
- skill cost model
- damage/resistance formulae
- action economy
- status-effect application rules
- AI decision model beyond authored enemy parameters

The authorized tuning surface is parameters first. Mechanics rewrites require discussion.

## Implementation units

**Unit 1 — machinery preflight**
- Run and/or add targeted coverage proving resource generation, skill casting, and status effects still work end-to-end.
- Record the evidence in the phase notes and playtest report.
- Fix any real engine bug found before proceeding.

**Unit 2 — roster measurement**
- Run the Phase 104 early-game and endgame probes.
- Expand measurement across the currently authored enemy roster where the harness permits.
- Record per-enemy/policy outcomes, with Coastal Tyrant kept visible until the 84% timeout / 0% friendship pattern is corrected.

**Unit 3 — parameter tuning loop**
- Adjust enemy/player parameters smallest-change-first.
- Prioritize stats/level/equipment/skills before any mechanics change.
- Re-run playtests after each meaningful adjustment.
- Preserve authored identity: alignment pins, enemy fantasy, mercy-route predicates, and skill-role intent should survive unless evidence says they are the problem.

**Unit 4 — closeout evidence**
- Produce before/after report evidence showing approximately 70% win rate for **every current strategy**.
- Include timeout, defeat, friendship, policy, skill-use, resource-use, and status-effect summaries.
- Confirm the STRATEGIST/status-effect path is viable and more expressive than basic attack repetition.
- Append a sound-mechanics summary to `automation/playtest/BALANCE_LEDGER.md` comparing final stats against Marker M0.
- Update `automation/playtest/NEXT_STEPS.md` if the loop reveals a new stable target or blind spot.

## Verify gate

- `npm test` twice if engine logic changes.
- `npm run type-check`.
- `npm run playtest` after each tuning increment.
- `npm run verify` before final closeout.
- `npm run deploy:check` if public/package surface or release files change.

## Definition of Done

- [ ] Resource-generation preflight evidence captured.
- [ ] Skill-casting preflight evidence captured.
- [ ] Status-effect preflight evidence captured.
- [ ] Baseline roster/playtest report captured before tuning.
- [ ] Parameter adjustments made only inside the authorized surface unless T explicitly approves mechanics changes.
- [ ] Current playtest report reaches approximately 70% win rate for **every current strategy**, including AGGRESSIVE, DEFENSIVE, MIXED, and STRATEGIST.
- [ ] STRATEGIST/status-effect evidence proves skill/status planning is viable and preferred over attack-only play.
- [ ] Timeout/friendship/policy pathologies are documented, fixed, explicitly retired from the harness, or carried as follow-up.
- [ ] Before/after evidence and exact commands are recorded in phase closeout.

## Follow-ups

- Difficulty-curve doctrine spec should follow after this phase has produced empirical bands worth writing into law.
- Mid-game reference probe remains useful if the roster measurement shows early/endgame probes leave the middle unlit.
