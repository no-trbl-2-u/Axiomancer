# Phase 150 — Enemy skill answer to player skill use

## Source

T accepted the combat doctrine on 2026-06-15: because player skills always hit and their damage/effects are static, the cost of skill use should not be fake hit uncertainty. The enemy should answer power with power.

Related mobile follow-up: remove the dice-roll tracker from deterministic skill use and add a skill-detail confirmation overlay before committing a skill.

## Goal

Make combat skill use a guaranteed but answerable escalation. When the player uses a skill, the enemy should use a skill in response when it can legally do so, instead of treating the player skill like an ordinary attack exchange.

## Scope

1. Add an enemy skill-response rule to combat resolution.
   - When the player action is `skill`, the enemy checks for a legal skill response.
   - If the enemy can use a skill, it selects one through existing enemy AI / priority rules and resolves it as the enemy action.
   - If no legal enemy skill exists, fall back to the current normal enemy action selection.

2. Preserve deterministic skill doctrine.
   - Do not reintroduce player skill hit rolls.
   - Do not make skill damage/effects random unless an authored skill already owns randomness through existing engine law.
   - The response is the consequence, not a disguised accuracy check.

3. Respect control and resource constraints.
   - Stun/silence/action restriction effects must prevent illegal enemy responses.
   - Enemy resources, cooldowns, known/equipped/available skill state, and affordability must be honored.
   - Enemies with no appropriate skill must remain valid combatants through fallback behavior.

4. Emit readable battle-log / event evidence.
   - Player skill use should clearly show the player skill result.
   - Enemy response should clearly show the enemy skill chosen, cost paid where applicable, and effects/damage applied.
   - Mobile consumers should be able to distinguish `enemy answered with skill` from ordinary enemy action selection if the current event surface supports it; otherwise add a nonbreaking event/detail field.

## Non-goals

- Do not redesign the whole enemy AI system.
- Do not alter player skill accuracy; skills still always land under current doctrine.
- Do not rebalance every enemy stat block in this phase unless evidence shows the response rule breaks a specific witness.
- Do not implement mobile UI changes here.

## Implementation notes

- Likely files: `src/Combat/combat.resolver.ts` or split resolver helpers, enemy action/AI selection modules, `src/Enemies/*` skill selection surfaces, battle-log/event types, and combat e2e tests.
- Prefer a small helper such as `selectEnemySkillResponse(...)` over burying the rule inline.
- The rule should be deterministic under the existing RNG/seed path.
- Use current enemy skill selection priorities where possible; if no priority exists, choose the first/highest-value affordable damaging or status skill by existing AI heuristic.

## Acceptance criteria

- [x] A player `skill` action causes the enemy to use an available legal skill as its response. (`selectEnemySkillResponse` in `src/Combat/phases/scenario.ts`, gated to HOSTILE player skills + a `ENEMY_SKILL_ANSWER_CHANCE` cadence)
- [x] If the enemy has no legal/affordable skill, current fallback enemy action behavior remains intact. (helper returns `null` → existing 5a-enemy / basic path)
- [x] Action restrictions prevent enemy skill response when appropriate. (`enemyCanAct` gate threaded from the action-restriction phase; covered by the stunned-enemy e2e case)
- [x] Player skill outcomes remain deterministic/always-hit. (no player accuracy roll introduced; the only RNG is the enemy answer's cadence on the existing seedable `getRng()` path)
- [x] Battle-log/events expose the player skill result and enemy skill response clearly enough for mobile to render without local simulation. (new `{ phase: 'scenario'; kind: 'enemy-skill-response'; skillId }` event + the enemy's `skill` execution stream)
- [x] Hermetic combat e2e covers: enemy skill response, fallback when no skill is available, and blocked response under restriction. (`src/Combat/e2e/enemy-skill-response.engine.test.ts` — also covers cadence-decline and non-hostile-skill suppression)
- [x] Playtest evidence is captured for at least one existing combat witness so the new response rule does not silently wreck the 65–75% target band. (`late-game-coastal-tyrant`; ledger marker M-150 — initial 100%-answer broke the STRATEGIST friendship route + difficult anchor, fixed by the hostility gate + 0.10 cadence; `npm run verify` green, follow-up tuning candidate filed to raise the cadence after a stat-block retune)

## Verification

Run:

- targeted combat resolver / enemy skill e2e
- `npm run type-check`
- `npm test -- --run src/Combat src/Enemies`
- `npm run playtest`
- `npm run verify`
- `npm run deploy:check`

If the response rule materially shifts combat balance, record the before/after in `automation/playtest/BALANCE_LEDGER.md` and file a follow-up tuning candidate rather than hiding the drift.
