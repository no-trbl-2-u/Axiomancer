# Twin's Dilation — `buff_haste`

> *"While you move at relativistic speeds, time slows for your enemies. You act twice in what feels like a single moment."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_haste` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 3 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 17 |

---

## Description

A Tier 3 Haste buff — the most powerful standard advantage effect. Only a natural 20 on
the resist roll repels it; all other rolls result in automatic application. Grants
`rollModifier +4` (the highest flat roll bonus in the game) and advantage on all three
stance types.

Short duration (2 rounds), non-stackable.

---

## Data Fields

### `tier: "Tier 3"`, `resistDR: 17`

Inescapable except on a natural 20. When applied as a debuff on the opponent, they need
a miracle to avoid it. When applied as a self-buff, the caster's own roll doesn't fail
it (Tier 3 resist rules only check the target's roll — for a self-buff, the Tier 2 buff
fumble/crit rules apply for the **caster**, while Tier 3 rules apply if this were a
debuff targeting an opponent).

> **Clarification:** The current `resolveEffectApplication` implementation treats Tier 3 effects
> the same whether buff or debuff — the Tier 3 path always does a resist roll. If this
> is applied as a self-buff by the player, the Tier 3 block would fire. This is a design
> area to clarify in Phase 2 — currently Tier 3 buffs and debuffs share the same
> near-inescapable resist path.

### `payload.rollModifier: 4`

Flat +4 to all rolls. **LIVE** — highest flat roll bonus in the library.

### `payload.advantageModifier.grantAdvantage: ["body", "mind", "heart"]`

Grants advantage on all stance types. **PENDING (Phase 2).** When implemented, this
means the bearer makes every roll with advantage regardless of the RPS matchup.

---

## Combat Behaviour

`rollModifier +4` is consumed immediately by `getActiveRollModifier`. The advantage
grants are pending Phase 2 wiring.

Duration 2 means this buff lasts only 2 rounds. Non-stackable.

---

## How to Test

### 1. rollModifier +4

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === 4);
```

### 2. Tier 3 resist: only nat 20 repels

```typescript
// Mock resolveEffectApplication with d20 roll mocked to 19:
// result.success === true, message contains "Inescapable"
// Mock to 20:
// result.success === false, message contains "Miracle"
```

### 3. Advantage grants (Phase 2 test)

```
Once wired: bearer of Twin's Dilation should have advantage on every attack roll
regardless of stance matchup.
```

### 4. Unit tests to write

```typescript
describe('Twins Dilation (buff_haste)', () => {
  it('rollModifier +4 via getActiveRollModifier', () => { ... });
  it('Tier 3: only nat 20 repels it', () => { ... });
  it('advantageModifier all stances (Phase 2)', () => { ... });
});
```
