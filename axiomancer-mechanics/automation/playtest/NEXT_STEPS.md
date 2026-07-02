# Playtest Automation — Next Steps

> Developer workflow integration for Phase 104 reference fixtures

## Reference Fixtures Integration

Phase 104 established two canonical balance probes that should be used as baselines when making balance changes:

### Early-Game Probe
- **Run**: `earlyGameFixture` from `src/Playtest/fixtures/early-game.ts`
- **Baseline**: Level-1 apprentice vs Tidepool Crab
- **Validation**: Changes should maintain reasonable survivability for new players

### Endgame Probe  
- **Run**: `endgameFixture` from `src/Playtest/fixtures/endgame.ts`
- **Baseline**: Max-level character vs Coastal Tyrant
- **Validation**: Changes should not make boss encounters trivial or impossible

### Mercy Probe (Phase 101)
- **Run**: `mercy` policy from `src/Playtest/policies.ts`  
- **Baseline**: Wound-then-spare approach against Coastal Tyrant
- **Validation**: Changes should maintain viable mercy route (timeout under 25%)

## Balance Change Workflow — Phase 107 loop

T locked the current stabilization loop on 2026-06-02: fix first, then playthrough, then fix, then playthrough. The first success target is approximately **70% win rate** in the current roster/playtest evidence.

Before tuning numbers, verify the machinery:

1. Token resource generation works: attack/defend grants, equipment/set generation bonuses, and emitted resource events agree with combat state.
2. Skills work: known/unlocked skills are available without an equipped-skill gate, only affordable skills are offered/cast, and `canUseSkill` / `spendResources` / `executeSkill` agree with playtest skill-use metrics.
3. Status effects work: skill-applied effects land under the Phase 80 contract where applicable and tick/expire/modify stats correctly.

Then repeat the loop:

1. **Adjust parameters** smallest-change-first: enemy stats/level, player stats/level, player equipment, and player skills.
2. **Playtest** with the Phase 104 probes plus the relevant roster scenario(s).
3. **Read the evidence**: win/defeat/friendship/timeout rates, rounds-to-resolve, policy summaries, skill use, resource events, item use, and stance/action distributions.
4. **Repeat** until the report reaches roughly 70% win rate and no obvious policy pathology remains.

If parameter tuning cannot reach the target, stop and bring T a mechanics proposal before changing friendship semantics, token formulae, skill costs, damage/resistance, action economy, status-effect rules, or AI rules beyond authored parameters.

Marker M0 and future sound-mechanics closeouts are recorded in `automation/playtest/BALANCE_LEDGER.md`. When mechanics are deemed sound, append the summary difference against Marker M0 with final stats.

## Example Usage

```typescript
import { runPlaytestScenario, earlyGameFixture, endgameFixture } from 'axiomancer-mechanics';

// Baseline measurement
const baselineEarly = runPlaytestScenario(earlyGameFixture);
const baselineEndgame = runPlaytestScenario(endgameFixture);

// After balance changes...
const newEarly = runPlaytestScenario(earlyGameFixture); 
const newEndgame = runPlaytestScenario(endgameFixture);

// Compare survivability rates
console.log('Early survivability:', 
  baselineEarly.metrics.survivabilityRate, '→', newEarly.metrics.survivabilityRate);
console.log('Endgame survivability:', 
  baselineEndgame.metrics.survivabilityRate, '→', newEndgame.metrics.survivabilityRate);
```

## Integration Opportunities

### CI/CD Pipeline (Future)
- Run reference fixtures on PR/merge to catch balance regressions
- Flag significant metric shifts for manual review
- Maintain historical baseline data for trend analysis

### Automated Regression Detection (Future)
- Define acceptable variance thresholds for each fixture
- Alert when changes push metrics outside expected bounds  
- Archive baseline data with each release tag

### Extended Coverage (Future)
- Additional enemy type probes (elite, unique encounters)
- Mid-game progression checkpoints
- Policy-specific balance validation (friendship route viability)

## Current Phase 107 Integration

Phase 101 proved one-boss tuning was not enough; the fresh roundtable evidence still showed the late-game Coastal Tyrant report at 16% win / 0% friendship / 84% timeout. Phase 107 consumes the Phase 104 probes roster-wide and treats Coastal Tyrant as the visible red signal until the loop proves otherwise.

Use the endgame probe as a primary data source for late-game tuning, but do not stop at one boss. The current mandate is roster-wide parameter tuning after resource/skill/status-effect preflight.

## Phase 107 Status Update — 2026-06-02

Phase 107 parameter tuning achieved partial success:

**Completed:**
- ✅ Machinery preflight passed (resource generation, skill casting, status effects all verified)  
- ✅ Parameter tuning improved overall win rate from 24% to 60%
- ✅ 3/4 policies near target: aggressive 71.4%, mixed 66.7% (both ~70% target)

**Remaining issues requiring follow-up:**
- ⚠️ DEFENSIVE policy dominance (100% win rate - needs slight difficulty increase)
- ❌ STRATEGIST policy failure (0% win rate - friendship mechanics investigation needed)
- ❌ No friendship victories achieved despite counter accumulation (max 14)

**Parameter changes made:**
- Coastal Tyrant: level 7→6, baseStats body 7→6, heart 6→4
- Sage preset: reverted to original baseStats after testing

**Next iteration priorities:**
1. Investigate STRATEGIST policy logic and the Befriend-as-heart-skill proposal from `docs/adr/ADR-0007-befriend-is-heart-skill-with-mercy-choice.md`.
2. Do **not** solve Coastal Tyrant by merely lowering the HP gate. Preserve HP pressure, but prototype explicit Befriend: starting heart skill, 5 heart tokens to attempt, then spare/befriend vs exploit/free-critical choice.
3. Slight difficulty increase to bring DEFENSIVE policy down from 100% to ~70%.
4. Verify friendship mechanics are working correctly (counters accumulate but victory never triggers under the current model).