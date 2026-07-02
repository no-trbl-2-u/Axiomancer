# Mechanics upgrade — `axiomancer-mechanics@0.14.0`

> Status: shipped. `npm view axiomancer-mechanics@0.14.0` resolves on the public registry and mobile now pins `axiomancer-mechanics@0.14.0`; Phase 106 performed the package bump, compile/import drain, integration checks, and evidence pass.

## What changed upstream

Mechanics `0.14.0` is the mobile catch-up release after `0.13.0`. The important changes for mobile are:

- **Phase 96 — BattleLogEntry contract validation:** combat log entries now require complete player/enemy action fields. Mobile should be able to trust action labels and stop defensive fallback copy for missing combat actions where the engine now guarantees them.
- **Phase 97 — `previewStatAllocation`:** engine exposes a pure stat-preview helper. Mobile level-up/stat allocation UI should call this instead of maintaining local derived-stat math.
- **Phase 99 — unlocked-skill access:** learned skills are gated by `knownSkills` plus combat-resource affordability, not by `equippedSkills`. Mobile combat skill lists must not treat `equippedSkills` as the source of truth.
- **Phase 101 / 107 — Coastal Tyrant evidence:** balance doctrine is now 65–75% per-playstyle resolution success (`victory + friendship/mercy`). Defensive and Strategist are intentionally under scrutiny because 100% success is too soft.
- **Phase 102 — befriendable-enemy expansion:** befriendable roster grows to 7, including elite/boss-tier requirements.
- **Phase 103 — combat re-trigger fix:** new encounters should be triggerable after victory, defeat, and friendship outcomes.
- **Phase 104 — reference playtest fixtures:** deterministic early/endgame fixture exports exist for consumer smoke and balance tests.
- **Phase 108 — Befriend as Heart skill:** Befriend is a starting Heart skill with a 5-heart-token attempt cost. A successful opening can require a visible mercy/exploit choice.
- **Phase 109 — region consequences:** elite/miniboss spare/exploit choices can alter later region-boss Befriend behavior through `RegionConsequences`.
- **Phase 110 — faction reputation:** boss Befriend outcomes can apply `FactionReputationDelta` values, producing a `factionReputationShift` payload for UI.

## Mobile work completed at Phase 106

1. Bumped `axiomancer-mechanics` from `0.13.0` to `0.14.0` as Phase 106 (`plan/phases/phase_106_mechanics_0_14_mobile_catchup.md`).
2. Run the mobile type suite and replace any imports removed in mechanics `0.14.0`:
   - `getResistStat` → `getEffectiveStats(combatant).baseStats[stance]`
   - `endCombatPlayerVictory`, `endCombatPlayerDefeat`, `endCombatWithFriendship` → `endCombat()` / engine outcome flow
3. Replace local stat-preview calculations with `previewStatAllocation`.
4. Audit combat skill presentation:
   - source unlocked skills from engine `knownSkills`/available-skill helpers;
   - source affordability from `CombatState.combatResources`;
   - do not gate the visible skill list by `equippedSkills`.
5. Implement or verify the Phase 103 mercy-choice modal against the actual mechanics `0.14.0` contract:
   - spare/befriend/preserve option;
   - exploit/free-critical option;
   - consequence-forward copy and accessibility labels.
6. Add presenter/view-model handling for new consequence surfaces:
   - `regionConsequences`
   - `factionReputationShift`
   - existing friendship reward / codex / alignment aftermath fields.
7. Add or refresh seeded visual/test evidence for:
   - Befriend skill attempt cost and choice modal;
   - post-combat aftermath showing region/faction consequences where reachable;
   - a second encounter after a terminal combat outcome, proving the re-trigger fix is consumed.

## Original mobile phase split

- **Package bump + compile drain:** bump package, fix removed-symbol imports, prove `npm test` + `npx tsc --noEmit`.
- **Presenter migration:** stat preview, unlocked-skill access, combat log assumptions.
- **Befriend consequence UI:** mercy-choice modal plus aftermath consequence renderers.
- **Evidence pass:** visual smoke and seeded playthrough coverage.

Phase 106 collapsed this split into one catch-up phase so `/march` consumed the release contract before further mobile polish.

## Source logs

- Mechanics `CHANGELOG.md` — `0.14.0` section.
- Mechanics `RELEASES.md` — short-form `0.14.0` summary.
- Mechanics `plan/steps/01_build_plan.md` — Phases 96–110, especially 108–110.
- npm registry — `axiomancer-mechanics@0.14.0` tarball resolves at `https://registry.npmjs.org/axiomancer-mechanics/-/axiomancer-mechanics-0.14.0.tgz`.
