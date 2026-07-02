# Phase 92 — Difficulty-meter gameplay scaling

## Outcome

`moralMeter` controls combat difficulty through enemy stat multipliers, resolving the braindump-vs-Spec-10 divergence by implementing the BRAINDUMP's intended difficulty scaling.

## Source spec

`specs/10-moral-difficulty-meter.md` — all 9 questions answered, but Q4 was marked "A (for now, will have more effects later)". The BRAINDUMP describes a "difficulty meter driven by moral choices" that affects combat, creating a design conflict. This phase implements the originally-intended scaling behavior.

## Implementation units

### Unit 1: Enemy stat scaling mechanics

- **File:** `src/Combat/difficulty.ts`
- **Types:** `DifficultyScaling { moralMeterThreshold: number; statMultiplier: number }[]`
- **Logic:** `calculateEnemyStatMultiplier(moralMeter: number): number`
- **Pattern:** Piecewise linear scaling:
  ```typescript
  // Lower morality = harder enemies
  // moralMeter: -100 to +100
  // multiplier: 0.5x to 2.0x
  const DIFFICULTY_SCALING: DifficultyScaling[] = [
    { moralMeterThreshold: -100, statMultiplier: 2.0 },  // ruthless path = 2x enemy stats
    { moralMeterThreshold: -50, statMultiplier: 1.5 },
    { moralMeterThreshold: 0, statMultiplier: 1.0 },    // neutral = baseline
    { moralMeterThreshold: 50, statMultiplier: 0.75 },
    { moralMeterThreshold: 100, statMultiplier: 0.5 }   // compassionate path = 0.5x enemy stats
  ];
  ```

### Unit 2: Combat integration

- **File:** `src/Combat/combat.resolver.ts`
- **Logic:** Modify `createEnemy` to apply moral meter scaling
- **Pattern:** Scale `baseStats` via `calculateEnemyStatMultiplier` when creating enemies
  ```typescript
  const statMultiplier = calculateEnemyStatMultiplier(gameState.moralMeter);
  const scaledStats = Object.fromEntries(
    Object.entries(template.baseStats).map(([stat, value]) => 
      [stat, Math.round(value * statMultiplier)]
    )
  );
  ```

### Unit 3: Engine tests

- **File:** `src/Combat/e2e/difficulty.scaling.engine.test.ts`
- **Pattern:** Hermetic test covering scaling at moral meter extremes (-100, 0, +100)
- **Cases:** Enemy stats scale correctly, maintains combat resolution integrity

## Decisions made upfront — DO NOT ASK

1. **Scaling direction:** Lower morality = harder combat (ruthless choices make enemies stronger). Consistent with "evil path = more rewards" from Spec 10 Q5.
2. **Scaling magnitude:** 0.5x to 2.0x multiplier range. Significant but not game-breaking.
3. **Scaling method:** Linear interpolation between thresholds. Simple, predictable.
4. **Stats affected:** All `baseStats` (health, attack, defense, etc). Uniform scaling.
5. **Application point:** At enemy creation time, not per-turn. Cleaner implementation.
6. **Rounding:** Round scaled stats to nearest integer to avoid fractional HP issues.

## Verify gate

- `npm run type-check` — new types and integration
- `npm test` — hermetic e2e test passes
- `npm run build` — clean build

## Commit body template

```
feat(combat): phase 92 — difficulty-meter gameplay scaling

- Add moral meter → enemy stat scaling mechanics
- Integrate scaling into combat enemy creation
- Add hermetic e2e test for scaling behavior

Decisions:
- Ruthless path (low morality) = stronger enemies (2x stats at -100)
- Compassionate path (high morality) = weaker enemies (0.5x at +100)
- Linear interpolation scaling applied at enemy creation time

Resolves braindump-vs-Spec-10 divergence on combat scaling.
```

## Definition of Done

- [ ] `calculateEnemyStatMultiplier` function exists and scales correctly
- [ ] Combat enemy creation applies moral meter scaling
- [ ] Ruthless path (-100 morality) makes enemies significantly harder
- [ ] Compassionate path (+100 morality) makes enemies easier  
- [ ] Hermetic e2e test covers scaling mechanics
- [ ] `docs/morality.md` updated with combat scaling section
- [ ] No regression in existing combat resolution

## Follow-ups (out of scope)

- Scaling other aspects (XP rewards, loot rates, skill effectiveness)
- Non-linear scaling curves (exponential, stepped)
- Per-enemy-type scaling overrides