# Quickstart — Character

> Create, configure, and level a character. For full API reference
> see [`character.md`](./character.md).

## Create a character

```typescript
import { createCharacter } from 'axiomancer-mechanics';

const hero = createCharacter({
  name: 'Phaedra',
  level: 1,
  baseStats: { body: 4, mind: 6, heart: 5 },
});
// hero.id is auto-generated (char-<base36> from RNG)
// hero.maxHealth = level × avg(body, heart) × 10
```

## Use a preset

```typescript
import { buildCharacterFromPreset, getPresetById } from 'axiomancer-mechanics';

const sage = buildCharacterFromPreset('sage');
// Level 15, pre-equipped gear, full skill roster
// Presets: 'apprentice' (L1), 'wanderer' (L8), 'sage' (L15)
```

## Allocate stat points

Characters earn `STAT_POINTS_PER_LEVEL` (3) points per level-up.

```typescript
import { allocateStatPoint } from 'axiomancer-mechanics';

const upgraded = allocateStatPoint(hero, 'mind');
// upgraded.baseStats.mind === 7
// upgraded.availableStatPoints decremented by 1
```

## Learn a skill

```typescript
import { learnSkill, getAvailableSkills } from 'axiomancer-mechanics';

// Check what's learnable at current level + alignment
const available = getAvailableSkills(hero, hero.knownSkills);

// Learn if requirements met
const result = learnSkill(hero, 'false-dilemma');
// result.character has the skill in knownSkills; there is no equipped-skill gate (ADR-0002)
```

## Equip items

```typescript
import { equipItem, unequipItem } from 'axiomancer-mechanics';

const equipped = equipItem(hero, someWeapon);
const bare = unequipItem(equipped, 'weapon');
```

## Deep-dive

- Full type reference: [`character.md`](./character.md)
- Presets source: `src/Character/presets.ts`
- Stat derivation: `src/Utils/index.ts` (`deriveStats`)
