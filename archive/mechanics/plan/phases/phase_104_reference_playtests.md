# Phase 104 — Reference playtests: early-game + endgame

## Outcome

Establish two canonical playtest fixtures — early-game and endgame scenarios — that anchor balance decisions with reproducible automated runs rather than ad-hoc manual testing.

## Why

Balance tuning currently relies on inconsistent manual testing. The user's jot #89(e) highlighted "difficulty is all over the place / no order." Phase 101 (Coastal Tyrant mercy tuning) needs a systematic endgame probe. Creating reference fixtures gives the difficulty-tuning loop reproducible data.

## Source spec

No dedicated spec — this is a testing/automation phase. References existing playtest infrastructure from prior phases and leverages the current `src/Playtest/` module established for policy-based testing.

## Implementation units

### Unit 1 — Reference fixture authoring

Create two canonical playtest fixtures in `src/Playtest/`:

1. **Early-game fixture** (`fixtures/early-game.ts`):
   - Level-1 character with 5/5/5 base stats (apprentice preset baseline)
   - Against weakest fishing-village enemies (GiantAnt, Slime)
   - Tests start-of-game balance and progression gate

2. **Endgame fixture** (`fixtures/endgame.ts`):
   - Max-level character with max stats and all skills/items unlocked
   - Against late-game/boss enemies (Coastal Tyrant, other boss-tier)
   - Tests late-game balance and boss encounter viability
   - Leverages existing dev-tools max-out patterns where available

Both fixtures export `PlaytestScenario` objects with consistent run counts, seed, and policy coverage.

### Unit 2 — Policy/report enhancement

Extend the playtest system to surface balance-relevant metrics:

1. **Enhanced metrics** (`types.ts`, `report.ts`):
   - Survivability rates per policy
   - Rounds-to-resolve distributions
   - Damage-dealt vs damage-taken ratios
   - Victory/defeat/friendship/timeout breakdowns

2. **Hermetic test coverage** (`e2e/reference-fixtures.engine.test.ts`):
   - Pin that both fixtures resolve without errors
   - Verify reports contain expected metrics fields
   - Smoke test that fixtures produce different balance signatures

### Unit 3 — Documentation and integration

1. **User docs** (`docs/playtest.md`):
   - Document the two reference runs as canonical balance probes
   - Explain their role in the difficulty-tuning workflow
   - Cross-link to Phase 101 endgame probe usage

2. **Developer workflow** (`automation/playtest/NEXT_STEPS.md`):
   - Document how balance changes should reference these fixtures
   - Establish the early/endgame probe as the standard baseline
   - Note integration with CI/automation if desired

## Decisions made upfront — DO NOT ASK

1. **Character baselines**: Early-game uses apprentice preset (5/5/5 stats), endgame uses max-level dev-tools pattern.
2. **Enemy selection**: Early-game targets weakest enemies (GiantAnt, Slime), endgame includes Coastal Tyrant.
3. **Policy coverage**: Use existing policies (`aggressive`, `defensive`, `friendship`, etc.) — don't create new ones.
4. **Report format**: Extend existing `PlaytestReport` structure rather than creating separate reporting.
5. **File structure**: Place fixtures in `src/Playtest/fixtures/` to separate from policy/runner logic.

## Verification

```bash
npm run verify     # type-check + tests + build
```

Both reference fixtures must run successfully and produce reports.

## Commit body template

```
feat(playtest): phase 104 — reference fixtures for early/endgame balance

- Early-game fixture: level-1 vs fishing-village weakest enemies
- Endgame fixture: max-level vs boss-tier encounters  
- Enhanced metrics: survivability, rounds-to-resolve, damage ratios
- Hermetic tests pin fixture resolution and report shape

Decisions:
- Apprentice preset (5/5/5) baseline for early-game consistency
- Coastal Tyrant as primary endgame probe target
- Extend existing PlaytestReport structure vs separate tooling

Pairs with Phase 101 which will consume the endgame probe for Coastal 
Tyrant mercy tuning.
```

## Definition of Done

- [ ] Early-game fixture authored and runnable via playtest runner
- [ ] Endgame fixture authored and runnable via playtest runner  
- [ ] Both fixtures export proper `PlaytestScenario` objects
- [ ] Enhanced metrics surface survivability, rounds-to-resolve, damage ratios
- [ ] Hermetic test verifies both fixtures resolve without errors
- [ ] `docs/playtest.md` documents the two reference runs as canonical probes
- [ ] `automation/playtest/NEXT_STEPS.md` explains integration with balance workflow
- [ ] All existing playtest tests remain green
- [ ] Verify gate passes

## Follow-ups (out of scope)

- Integration of reference fixtures into CI/automation pipeline
- Additional enemy coverage beyond early-game weakest + Coastal Tyrant  
- Policy refinements based on reference fixture findings
- Cross-phase integration with automated balance regression detection