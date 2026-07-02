# Phase 114 — Second Enemy Class Family Content Expansion

## Outcome

Ship 8–12 new enemies in a northern-forest class family with diverse AI patterns, befriendability configs across normal/elite/boss tiers, philosophical alignment representation, and varied combat resources/skill patterns.

## Source spec

Spec 07 enemy content foundation (completed) + Phase 114 build plan row. The existing coastal/fishing-village enemy family provides the established pattern for enemy authoring: Enemy type definitions, AI behavior variants, friendship reward content, journal entries, combat stat distributions.

## Implementation units

### Unit 1: Northern-forest enemy definitions (8–12 enemies)
- **File**: `src/Enemy/enemy.library.ts` (append to existing library)
- **Types**: Extend existing enemy creation pattern
- **Logic**: Author 8–12 new enemies themed around northern-forest/woodland environments
- **Pattern**: Follow established `createEnemy()` calls with:
  - `mapName: 'northern-forest'` or northern-continent maps
  - Difficulty spread: 2–3 normal, 2–3 elite, 1–2 boss, 1 unique (varies by exact count)
  - Stat affinities distributed across heart/body/mind (mirroring existing distribution)
  - Philosophical alignment spanning multiple cube cells (avoiding duplication of existing coastal family alignments)
  - Combat resources: varied skill rotations, proc overrides for elite/boss tiers
  - Befriendability configs: normal tier uses basic thresholds, elite/boss tiers use enhanced requirements

### Unit 2: AI behavior diversification
- **File**: `src/Enemy/enemy.logic.ts` (extend existing logic variants)
- **Types**: Extend `EnemyLogic` union if needed
- **Logic**: Implement diverse AI patterns beyond randomLogic variants
- **Pattern**: Enhance or add new logic types:
  - Strategic patterns that read enemy state, status effects, HP-gate proximity
  - Woodland-specific behavioral patterns (defensive/territorial, pack-like coordination concepts)
  - Elite/boss specific AI improvements for the new family

### Unit 3: Friendship reward content & journal entries
- **File**: Enemy definitions in `enemy.library.ts`
- **Types**: Use existing `CodexEntry` and friendship reward patterns
- **Logic**: Author journal entries and friendship outcomes for each new enemy
- **Pattern**: 
  - `journalEntry` fields with thematic northern-forest content
  - `finalBlowLines` and `causeLines` with woodland/northern themes
  - Varied philosophical perspectives reflecting northern-forest inhabitants

### Unit 4: Export barrel & e2e test coverage
- **File**: `src/Enemy/index.ts` (export new enemies)
- **File**: `src/Enemy/e2e/northern-family.engine.test.ts` (new test file)
- **Types**: Use existing enemy test patterns
- **Logic**: Export all new enemies via barrel, add hermetic e2e coverage
- **Pattern**: 
  - Export all 8–12 new enemies in the Enemy module barrel
  - Create comprehensive e2e test covering new enemy family interactions
  - Test AI diversity, befriendability configs, and philosophical alignment distribution

## Decisions made upfront — DO NOT ASK

- **Class family theme**: Northern-forest/woodland to complement existing coastal family
- **Enemy count**: Target 10 enemies (middle of 8–12 range) for manageable scope
- **Difficulty distribution**: 3 normal, 3 elite, 2 boss, 2 unique (= 10 total)
- **Map assignment**: Use `'northern-forest'` mapName (aligns with Phase 117 northern-forest expansion)
- **AI patterns**: Focus on strategic/territorial behaviors vs random patterns; enhance existing logic types rather than adding new enum members
- **Philosophical spread**: Deliberately choose alignments that complement rather than duplicate the existing coastal family's philosophical positions
- **Befriendability**: Normal tier uses standard thresholds, elite/boss require enhanced configs (HP gates, stance requirements, etc.)

## Verify gate

```bash
npm run verify     # npm run type-check && npm test && npm run build
```

All new enemy exports must pass type-check, new e2e tests must be green, build must succeed.

## Commit body template

```
feat(enemy): Phase 114 — Second enemy class family (northern-forest)

- Add 10 new enemies in northern-forest class family
- Diverse AI patterns with strategic behaviors beyond randomLogic
- Befriendability configs spanning normal/elite/boss tiers
- Philosophical alignment representation across multiple cube cells
- Journal entries and friendship reward content for all enemies
- Comprehensive e2e test coverage for new enemy family

Decisions:
- Northern-forest theme chosen to complement existing coastal family
- 10 enemies total (3 normal, 3 elite, 2 boss, 2 unique)
- Strategic/territorial AI patterns vs new enum additions
- Enhanced befriendability configs for elite/boss tiers
```

## Definition of Done

- [ ] 8–12 new enemies authored in `src/Enemy/enemy.library.ts`
- [ ] All enemies use `'northern-forest'` or northern-continent mapName
- [ ] Difficulty distribution spans normal/elite/boss tiers appropriately
- [ ] Diverse AI patterns beyond current randomLogic variants
- [ ] Befriendability configs with enhanced requirements for higher tiers
- [ ] Philosophical alignment representation across multiple cube cells
- [ ] Combat resources with varied skill resistance patterns
- [ ] Journal entries (`journalEntry` field) for all new enemies
- [ ] Friendship reward content (`finalBlowLines`, `causeLines`)
- [ ] All new enemies exported via `src/Enemy/index.ts`
- [ ] Hermetic e2e test file covering new enemy family
- [ ] `npm run verify` passes (type-check + test + build)

## Follow-ups (out of scope)

- Integration with Phase 117 northern-forest map expansion (will reference these enemies)
- Balancing adjustments based on playtest feedback (future iterate)
- Additional AI logic enum members (if strategic enhancements prove insufficient)