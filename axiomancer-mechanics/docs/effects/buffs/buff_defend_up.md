# Hilbert's Shelter — `buff_defend_up`

> *"Your defense is an infinite hotel—no matter how many attacks arrive, there's always room to accommodate them without harm."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_defend_up` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 14 |

---

## Description

An all-encompassing Tier 2 defensive buff. Raises all three base stats by 1, all three
defence derived stats by 2, and adds a large flat `defenseModifier` of +4. Because it
uses `stacking: 'none'`, it cannot be intensified — reapplication is ignored while it is
already active.

---

## Data Fields

### `stacking: "none"`

Once active, reapplication is silently ignored. The existing instance is held.

### `resistedBy: "heart"`, `resistDR: 14`

Higher difficulty (14) reflects the power of a full-stat defensive buff. Caster's heart
defence is the relevant stat.

### `payload.defenseModifier: 4`

Large flat +4 to defence calculations across all types. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[
  { "stat": "body",            "value": 1 },
  { "stat": "mind",            "value": 1 },
  { "stat": "heart",           "value": 1 },
  { "stat": "physicalDefense", "value": 2 },
  { "stat": "mentalDefense",   "value": 2 },
  { "stat": "emotionalDefense","value": 2 }
]
```

> **PENDING (Phase 2):** Not yet applied to derived stats.

---

## Combat Behaviour

Tier 2 buff apply roll. Nat 1 fizzles; nat 20 doubles intensity to 2 (still only one
active instance since stacking is `'none'`, but the intensity of that instance doubles
for display and any intensity-scaled future mechanics).

---

## How to Test

### 1. Verify stacking 'none' blocks reapplication

```typescript
const { activeEffects: ae1 } = applyEffect([], effect, 1);
const { result } = applyEffect(ae1, effect, 2);
// result.success === false — "already active — stronger instance held"
assert(ae1.length === 1); // still only one instance
```

### 2. defenseModifier pending

```
Phase 2: character with Hilbert's Shelter should have effective defence +4 against all types.
```

### 3. Unit tests to write

```typescript
describe('Hilbert Shelter (buff_defend_up)', () => {
  it('stacking none: reapplication ignored', () => { ... });
  it('Tier 2: nat 1 fizzles', () => { ... });
});
```
