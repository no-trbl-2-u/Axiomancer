# Theseus' Constitution — `buff_body_defense_up`

> *"Like the legendary ship, your body repairs and replaces itself—each wound healed strengthens the whole, though philosophers may debate if you remain the same."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_body_defense_up` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | duration |
| **Resisted By** | mind |
| **Resist DR** | 12 |

---

## Description

A Tier 2 defensive buff that strengthens physical resilience. Raises `body`,
`physicalDefense`, and adds a `defenseModifier`. Stacks by **duration** rather than
intensity — reapplication extends how long it lasts, not how powerful it is.

---

## Data Fields

### `duration: 4`, `stacking: "duration"`

The duration-stacking model means reapplying this buff adds 4 rounds to
`remainingDuration` (capped at `MAX_EFFECT_DURATION = 10`). Intensity stays at 1. This
reward for repeated application is duration rather than power — making it a good
long-term defensive investment.

### `resistedBy: "mind"`, `resistDR: 12`

Caster rolls d20; mind defence used as resist stat at DR 12 (easier than average).

### `payload.statModifiers`

```json
[
  { "stat": "body",            "value": 2, "isMultiplier": false },
  { "stat": "physicalDefense", "value": 3, "isMultiplier": false }
]
```

> **PENDING (Phase 2):** Not yet applied to derived stats in combat.

### `payload.defenseModifier: 2`

Flat +2 to defence calculations when blocking physical attacks.

> **PENDING (Phase 2):** Not yet wired into the damage/defence path.

---

## Combat Behaviour

Tier 2 buff apply. Nat 1 fizzles. Nat 20 sets `intensity` to 2 (double, as per
Tier 2 buff crit rule — the engine doubles `intensity` to min(1×2, 6) = 2, though
stacking is `'duration'`, so future reapplications will still extend duration rather than
intensity).

On reapplication with `stacking: 'duration'`: `remainingDuration` extends by 4, capped
at 10.

---

## How to Test

### 1. Duration extends on reapplication

```typescript
// applyEffect with stacking 'duration'
const { activeEffects: ae1 } = applyEffect([], effect, 1); // duration 4
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2); // duration 8
assert(ae2[0].remainingDuration === 8);
```

### 2. defenseModifier pending verification

```
Once Phase 2 is implemented:
  A character with Theseus' Constitution should take less physical damage.
  defenseModifier +2 should subtract from incoming damage.
```

### 3. Unit tests to write

```typescript
describe('Theseus Constitution (buff_body_defense_up)', () => {
  it('stacks by extending duration, not intensity', () => { ... });
  it('caps duration at MAX_EFFECT_DURATION', () => { ... });
  it('Tier 2: nat 20 doubles intensity', () => { ... });
});
```
