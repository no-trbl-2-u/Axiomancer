# EPR Entanglement — `buff_invincibility`

> *"You become quantum-entangled with a safe version of yourself in another reality. All harm befalls that other you; you remain untouched."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_invincibility` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 3 |
| **Duration** | 1 round |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 18 |

---

## Description

The single most powerful defensive effect in the game. A Tier 3, 1-round invincibility
buff. `defenseModifier: +99` makes it effectively impossible to take damage through
normal combat resolution. The highest `resistDR` in the library (18) means only a
natural 20 can repel it when applying to a target.

Duration 1 means it lasts exactly one round after application — a last-stand emergency
protection.

---

## Data Fields

### `tier: "Tier 3"`, `resistDR: 18`

Highest DR. Near-inescapable when applied.

### `duration: 1`, `stacking: "none"`

One round of protection, non-stackable. Cannot be extended by `extendRandomBuffDuration`
beyond `MAX_EFFECT_DURATION` (10), though its base is only 1.

### `payload.defenseModifier: 99`

`+99` flat defence modifier. Once Phase 2 wires `defenseModifier` into damage resolution,
any incoming attack would need to deal 99+ effective attack to overcome this — practically
impossible in the game's current stat ranges.

> **PENDING (Phase 2):** Not yet wired into the damage path.

---

## How to Test

### 1. Tier 3: only nat 20 repels

```typescript
// Mock resolveEffectApplication with Tier 3 path, d20 = 19
// result.success === true, "Inescapable"
// d20 = 20 → result.success === false, "Miracle"
```

### 2. defenseModifier +99 (Phase 2)

```
Once implemented: incoming damage should be reduced to 0 (or near-0) for all normal
attack values.
```

### 3. Unit tests to write

```typescript
describe('EPR Entanglement (buff_invincibility)', () => {
  it('Tier 3: only nat 20 repels', () => { ... });
  it('defenseModifier +99 blocks all standard damage (Phase 2)', () => { ... });
  it('expires after 1 round via tickAllEffects', () => { ... });
});
```
