# Arrow's Impossibility — `buff_evasion_up`

> *"Like Zeno's arrow frozen in each instant, attacks that should strike you simply... don't. Motion toward harm becomes impossible."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_evasion_up` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | duration |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 evasion buff that combines a defence modifier, all-defence stat boosts, and
a rare beneficial `advantageModifier` that grants **disadvantage** to attackers across
all stances. Stacks by duration — reapplication extends duration rather than power.

---

## Data Fields

### `payload.defenseModifier: 3`

Flat +3 to defence. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[
  { "stat": "physicalDefense",  "value": 2 },
  { "stat": "mentalDefense",    "value": 2 },
  { "stat": "emotionalDefense", "value": 2 }
]
```

**PENDING (Phase 2).**

### `payload.advantageModifier.grantDisadvantage: ["body", "mind", "heart"]`

All incoming attacks have disadvantage against the bearer. This is the most powerful
aspect of the effect — forcing attackers to roll with disadvantage across all stance
types.

> **PENDING (Phase 2):** Not yet wired into roll resolution in `src/Combat/phases/scenario.ts`.
> When implemented, attackers against a bearer of this effect should have their roll
> penalised by the disadvantage modifier (`getAdvantageModifier('disadvantage') = -2`),
> or roll twice and take the lower value depending on the final advantage system design.

---

## Combat Behaviour

Tier 2 buff apply path. Duration-stacking: reapplication adds 3 rounds. Nat 1 fizzles;
nat 20 doubles intensity (though with duration stacking, intensity stays at 1 and the
doubled value only matters for future mechanics scaled by intensity).

---

## How to Test

### 1. Duration stacks correctly

```typescript
const { activeEffects: ae1 } = applyEffect([], effect, 1); // dur 3
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2); // dur 6
assert(ae2[0].remainingDuration === 6);
```

### 2. advantageModifier grantDisadvantage (Phase 2 test)

```
Once wired: attacking a bearer of Arrow's Impossibility should show "Disadvantage"
for all stance types in the combat roll resolution.
```

### 3. Unit tests to write

```typescript
describe('Arrows Impossibility (buff_evasion_up)', () => {
  it('duration stacks on reapplication', () => { ... });
  it('advantageModifier grants disadvantage all stances (Phase 2)', () => { ... });
});
```
