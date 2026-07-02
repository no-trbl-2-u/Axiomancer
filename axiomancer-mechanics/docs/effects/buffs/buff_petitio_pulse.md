# Petitio Principii Pulse — `buff_petitio_pulse`

> *"Your courage assumes itself justified. The argument is circular, the logic bankrupt—yet somehow the conviction holds just long enough to matter."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_petitio_pulse` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 1 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 10 |

---

## Description

A minor Tier 1 buff that raises `heart` by 1. Unlike the four combat Tier 1 stance
effects, this buff has `resistedBy` and `resistDR` fields (both with DR 10), suggesting
it may have been designed as a skill or ability-triggered effect rather than a pure
auto-apply. With DR 10 it is the easiest possible resist roll to beat.

`stacking: 'none'` means it cannot be intensified. One active instance only.

---

## Data Fields

### `tier: "Tier 1"` with resist fields

The combination of Tier 1 with `resistedBy` and `resistDR` is unusual — the four
standard combat Tier 1 stance effects have no resist fields at all. This effect may have
been intended as a slightly-resisted minor buff, but the `resolveEffectApplication` code short-
circuits on `tier === 'Tier 1'` and returns `success: true` without a roll:

```typescript
if (tier === 'Tier 1') {
    return { success: true, activeEffect, message: `Effect applied automatically.` };
}
```

This means `resistedBy` and `resistDR` are **not read** for Tier 1 effects in the
current engine. The effect auto-applies.

### `payload.statModifiers`

```json
[{ "stat": "heart", "value": 1, "isMultiplier": false }]
```

`+1 heart`. **PENDING (Phase 2).**

---

## How to Test

### 1. Auto-applies despite resist fields

```typescript
const result = resolveEffectApplication(target, activeEffect, 'buff', 0, 0);
assert(result.success === true);
assert(result.message === 'Effect applied automatically.');
// No roll was made
```

### 2. stacking none: reapplication ignored

```typescript
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false);
```

### 3. Unit tests to write

```typescript
describe('Petitio Principii Pulse (buff_petitio_pulse)', () => {
  it('auto-applies (Tier 1) despite having resistedBy field', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
  it('+1 heart statModifier applied (Phase 2)', () => { ... });
});
```
