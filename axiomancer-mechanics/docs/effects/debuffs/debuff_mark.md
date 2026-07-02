# Raven's Target — `debuff_mark`

> *"Evidence confirms equivalent hypotheses. A green apple confirms all ravens are black—and confirms you are the target. Everything points to you."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_mark` |
| **Type** | debuff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 mark debuff combining `defenseModifier: -3` with disadvantage on all stances
against the marked target. Non-stackable. Makes the marked target easier to hit from
all angles.

Note: this is distinct from `tier1_mind_mark` (Exposed Reasoning). Raven's Target is a
Tier 2 disadvantage debuff; Exposed Reasoning is a Tier 1 damage-bonus debuff.

---

## Data Fields

### `payload.defenseModifier: -3`

Flat -3 to defence. **PENDING (Phase 2).**

### `payload.advantageModifier.grantDisadvantage: ["body", "mind", "heart"]`

All attacker stance types grant disadvantage against the marked target (i.e., attackers
gain advantage from the target's perspective — the marked target has disadvantage on all
their defensive actions).

> **PENDING (Phase 2):** When implemented, this should grant the **attacker** advantage
> (not the target disadvantage), since the debuff is on the target and the grantDisadvantage
> arrays indicate stance types that become disadvantageous **for the bearer**. Confirm
> the implementation intent with the design spec.

---

## How to Test

```typescript
describe('Ravens Target (debuff_mark)', () => {
  it('stacking none: reapplication ignored', () => { ... });
  it('defenseModifier -3 in damage path (Phase 2)', () => { ... });
  it('grantDisadvantage all stances applied (Phase 2)', () => { ... });
});
```
