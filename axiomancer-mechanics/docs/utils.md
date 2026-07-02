# Utilities

> Core utility functions used throughout the axiomancer-mechanics engine.
> Math, string, dice rolling, and stat calculation helpers.

## Overview

The `Utils` module provides fundamental utilities used across the engine:

- **Math utilities**: clamp, randomInt, average, sum, min/max, range checks
- **String utilities**: capitalize, formatPercent  
- **Dice system**: createDie, createDieRoll, advantage/disadvantage rolling
- **Stat derivation**: deriveStats, deriveNonCombatStats, calculateMaxHealth
- **General**: deepClone for immutable operations

All utilities follow the engine's RNG conventions — die rolls use `getRng()` instead of `Math.random` for deterministic testing.

## Public API

### Math utilities

#### `clamp(value: number, min: number, max: number): number`

Constrains a value to a range.

```typescript
clamp(15, 0, 10)  // 10
clamp(-5, 0, 10)  // 0  
clamp(7, 0, 10)   // 7
```

#### `randomInt(min: number, max: number): number`

Generates a random integer in the inclusive range [min, max]. Uses the engine's `getRng()` for consistent seeding.

```typescript
randomInt(1, 6)    // 1-6 (like a d6)
randomInt(10, 20)  // 10-20 inclusive
```

#### `average(...numbers: number[]): number`

Calculates the arithmetic mean of the provided numbers.

```typescript
average(1, 2, 3, 4, 5)  // 3
average()               // 0
```

#### `sum(arr: number[]): number`

Sums all values in an array.

```typescript
sum([1, 2, 3, 4])  // 10
sum([])            // 0
```

#### `max(arr: number[]): number` / `min(arr: number[]): number`

Returns the largest or smallest value in an array.

```typescript
max([1, 5, 3])  // 5
min([1, 5, 3])  // 1
```

#### `inRange(value: number, min: number, max: number): boolean`

Tests if a value falls within an inclusive range.

```typescript
inRange(5, 1, 10)   // true
inRange(15, 1, 10)  // false
```

### String utilities

#### `capitalize(str: string): string`

Capitalizes the first letter of a string.

```typescript
capitalize("hello")  // "Hello"
capitalize("")       // ""
```

#### `formatPercent(value: number, decimals: number = 0): string`

Formats a number as a percentage string.

```typescript
formatPercent(75)      // "75%"
formatPercent(33.333, 1)  // "33.3%"
```

### Dice system

#### `createDie(sides: number, timesRolled: number, func?: (arr: number[]) => number, rng?: Rng)`

Creates a customizable die-rolling function.

```typescript
const d6 = createDie(6, 1);        // Standard d6
const d20Adv = createDie(20, 2, max);  // Advantage: 2d20, keep higher
const d20Dis = createDie(20, 2, min);  // Disadvantage: 2d20, keep lower

d6()       // 1-6
d20Adv()   // 1-20 (best of 2 rolls)
```

#### `createDieRoll(advantage: Advantage)`

Creates a d20 roll with advantage/disadvantage/neutral mechanics following D&D conventions.

```typescript
import { createDieRoll } from 'axiomancer-mechanics';

const neutralRoll = createDieRoll('neutral');      // 1d20
const advRoll = createDieRoll('advantage');        // 2d20, keep higher  
const disRoll = createDieRoll('disadvantage');     // 2d20, keep lower

neutralRoll()  // 1-20
advRoll()      // 1-20 (best of 2)
disRoll()      // 1-20 (worst of 2)
```

#### `determineRollAdvantageModifier(advantage: Advantage): (arr: number[]) => number`

Returns the appropriate function to apply advantage/disadvantage to a roll array.

```typescript
const advMod = determineRollAdvantageModifier('advantage');  // returns max
const neutralMod = determineRollAdvantageModifier('neutral'); // returns sum
const disMod = determineRollAdvantageModifier('disadvantage'); // returns min
```

### Stat derivation

#### `deriveStats(baseStats: BaseStats): DerivedStats`

Calculates combat-relevant derived stats from base stats (body/heart/mind). Used by both Characters and Enemies.

```typescript
const derivedStats = deriveStats({ body: 10, heart: 8, mind: 12 });
// Returns: physicalAttack, physicalSkill, physicalDefense,
//          mentalAttack, mentalSkill, mentalDefense,  
//          emotionalAttack, emotionalSkill, emotionalDefense, luck
```

The derivation uses constants from `game-mechanics.constants.ts`:
- Attack stats: `baseStatValue * ATTACK_MULTIPLIER`
- Skill stats: `baseStatValue * SKILL_MULTIPLIER`  
- Defense stats: `baseStatValue * DEFENSE_MULTIPLIER`
- Luck: `average(body, heart, mind)`

#### `deriveNonCombatStats(baseStats: BaseStats): NonCombatStats`

Calculates non-combat stats for Characters (Enemies don't have these).

```typescript
const nonCombat = deriveNonCombatStats({ body: 10, heart: 8, mind: 12 });
// Returns: physicalSave, physicalTest, mentalSave, mentalTest,
//          emotionalSave, emotionalTest
```

#### `calculateMaxHealth(level: number, healthStats: Pick<BaseStats, 'body' | 'heart'>): number`

Calculates maximum health based on level and constitution stats.

```typescript
const maxHP = calculateMaxHealth(3, { body: 10, heart: 8 });
// Formula: level * average(body, heart) * HEALTH_PER_STAT
```

### General utilities

#### `deepClone<T>(obj: T): T`

Creates a deep copy of an object using JSON serialization. Does not preserve functions, symbols, undefined values, or circular references.

```typescript
const original = { a: 1, b: { c: 2 } };
const copy = deepClone(original);
copy.b.c = 99;  // original.b.c is still 2
```

## Usage patterns

### RNG consistency

All dice utilities use `getRng()` instead of `Math.random`, ensuring deterministic behavior when the RNG is seeded (critical for testing and replays).

```typescript
// In tests, control the RNG:
import { setRng, mockSequentialRng } from 'axiomancer-mechanics/test-utils';
setRng(mockSequentialRng([1, 2, 3, 4, 5, 6]));

const roll = randomInt(1, 6);  // Will return 1, then 2, then 3...
```

### Stat derivation pipeline

Character and Enemy creation both use the stat derivation utilities:

```typescript
import { deriveStats, calculateMaxHealth } from 'axiomancer-mechanics';

const baseStats = { body: 10, heart: 8, mind: 12 };
const derived = deriveStats(baseStats);
const maxHealth = calculateMaxHealth(level, baseStats);

const character = {
  baseStats,
  derivedStats: derived,
  maxHealth,
  currentHealth: maxHealth,
  // ...
};
```

### Advantage/disadvantage dice

The dice system integrates with the combat advantage mechanics:

```typescript
import { createDieRoll } from 'axiomancer-mechanics';

function rollAttack(advantage: Advantage): number {
  const roll = createDieRoll(advantage);
  const attackStat = getAttackStat(attacker, stance);
  return roll() + attackStat;
}
```

## Testing

Utilities are covered by hermetic tests in `src/Utils/e2e/rng.engine.test.ts` and unit tests throughout the engine. The RNG-dependent functions are tested with controlled `mockFixedRng` and `mockSequentialRng` instances to ensure deterministic behavior.