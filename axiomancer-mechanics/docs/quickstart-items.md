# Quickstart — Items

> Drop items, preview at rarity, equip gear, and work with set
> bonuses. For full API reference see [`items.md`](./items.md) and
> [`equipment.md`](./equipment.md).

## Drop an item (procedural generation)

```typescript
import { dropItem, getEquipmentTemplate } from 'axiomancer-mechanics';

const template = getEquipmentTemplate('iron-sword')!;
const rolled = dropItem(template, {
  playerLevel: 5,
  rarity: 'rare',
});
// rolled.name, rolled.slot, rolled.rolledModifiers[]
// Each modifier has resolved numeric values from its level tier
```

## Preview at a specific rarity

```typescript
import { previewTemplateAtRarity, previewTemplateAtAllRarities } from 'axiomancer-mechanics';

// Single rarity preview (UI tooltip)
const preview = previewTemplateAtRarity('iron-sword', 'rare', 5);

// All-rarity strip (item-detail comparison view)
const strip = previewTemplateAtAllRarities('iron-sword', 5);
// strip: { common: Equipment, uncommon: Equipment, rare: Equipment, epic: Equipment, legendary: Equipment }
```

## Equip and unequip

```typescript
import { equipItem, unequipItem } from 'axiomancer-mechanics';

const equipped = equipItem(character, rolledWeapon);
const bare = unequipItem(equipped, 'weapon');
```

## Shop economy

```typescript
import { buyItem, sellItem, defaultSellPrice } from 'axiomancer-mechanics';

// Buy (price check + gold deduction)
const afterBuy = buyItem(character, healingPotion, 25);

// Sell (floor(price/2) heuristic)
const sellPrice = defaultSellPrice(25); // 12
const afterSell = sellItem(character, itemId, sellPrice);
```

## Set bonuses

```typescript
import {
  getActiveSetBonuses, itemSetLibrary, getItemSetById,
} from 'axiomancer-mechanics';

// Check active sets on a character's equipment
const bonuses = getActiveSetBonuses(character.equipment);
// bonuses: SetBonus[] — each has resourceInteraction / statModifiers / passiveEffects

// Lookup a specific set
const wanderers = getItemSetById('wanderers-road');
// wanderers.memberTemplateIds: ['sandals', 'leather-cap']
// wanderers.bonuses[2].resourceInteraction.combatStartTokens: { heart: 2 }
```

## Deep-dive

- Modifier catalogue: [`equipment.md`](./equipment.md) § Modifier system
- Set items: [`equipment.md`](./equipment.md) § Set Items
- Shop types: [`items.md`](./items.md) § Shop economy
- Rarity weight table: `src/Items/drop.ts`
