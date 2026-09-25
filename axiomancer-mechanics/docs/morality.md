# Morality System

> **Status:** Phase 92 complete — moral choice tracking, friendship bonus,
> dialogue integration, and save migration (v2→v3) are live.
> The beggar encounter in fishing-village demonstrates the moral choice pipeline.
> The Phase 92 moral-meter enemy stat scaling was removed in TRIM THE FAT T2a
> (2026-09-25); the meter no longer changes combat difficulty.
>
> **Display name (Phase 44h):** the player-facing name for this meter is
> **GRACE**, in three bands — **In Arrears** (≤ -34), **Indifferent**,
> **In Grace** (≥ +34). Nothing mechanical changes: the engine field stays
> `moralMeter`, the reducer stays `shiftMoralMeter`, the clamp and every
> delta band below are untouched (spec 34 §6.1). This doc keeps using
> `moralMeter` throughout as the engine-level name.

## Overview

The morality system tracks player alignment through choices made in dialogue,
combat outcomes, and quest resolutions. The moral meter influences available 
dialogue options, story paths, and endings—not through
direct gating but by affecting which narrative branches open over time.

## Relationship to `philosophicalAlignment` (Phase 42)

`moralMeter` and `state.philosophicalAlignment` are **orthogonal** axes
that persist independently across save / load. The single-axis
compassion ↔ ruthlessness meter described in this doc is unrelated to
the 3-axis epistemology / outlook / scope cube introduced at Phase 42.
A player can be high-moral *and* faith-optimistic-transcendent; the two
systems never interact through the same reducer or the same field —
they coexist on `GameState`. No unification is planned in v1 (Spec 10
Q8 picked "specific story flags as ending selector" with both axes as
narrative colour, not as gating).

See [`docs/oaths.md`](./oaths.md) for the alignment cube +
27-cell registry; "Relationship to `moralMeter`" on that page reflects
the same orthogonality from the other side.

## Core Mechanics

### Moral Meter

`GameState.moralMeter: number` ranges from **-100** (ruthless) to **+100** 
(compassionate), defaulting to **0** (neutral) for new games and migrated saves.

```ts
// Examples of moral meter values
-100  // Completely ruthless
 -25  // Tends toward harsh choices  
   0  // Neutral/balanced
 +35  // Generally compassionate
+100  // Saint-like moral standing
```

### Choice Magnitudes

Different choices shift the moral meter by varying amounts:

- **Minor choices:** ±1 (small acts of kindness/cruelty)
- **Major choices:** ±5 (significant moral decisions) 
- **Defining choices:** ±10 (life-changing moral stands)
- **Friendship victories:** +1 (successful peaceful resolution)

### Clamping and Gating

The system enforces bounds and enables conditional choices:

```ts
// Automatic clamping - shifts never exceed [-100, +100]
state.moralMeter = Math.max(-100, Math.min(100, currentMeter + delta));

// Optional gating - block shifts based on current alignment
gameState.shiftMoralMeter(delta, { min: 20 }); // Requires meter ≥ 20
gameState.shiftMoralMeter(delta, { max: -10 }); // Requires meter ≤ -10
```

## Integration Points

### Combat: Friendship Victories

When combat ends with a friendship victory, the player gains **+1** to
the moral meter, representing the compassion shown in finding peaceful
resolution.

The default friendship trigger (Phase 36) is `friendshipCounter >= 3`
(`FRIENDSHIP_COUNTER_MAX`) — both combatants defending on the same
round increments the counter. Phase 68 added a per-enemy override:
when the befriended enemy carries `Enemy.befriendabilityConfig`, the
trigger is the AND-composed predicate set (`roundsThreshold` /
`hpGate` / `requiredStances` / `requiredCardUse`), not the global
counter cap. The +1 moralMeter shift fires the same way regardless of
which trigger path resolved — `outcome === 'friendship'` is the only
condition this module reads. See `docs/combat.md` § "Friendship Path"
and § "Per-enemy predicate (Phase 68 — `BefriendabilityConfig`)" for
the eligibility-check details.

**Orthogonal alignment shift (Phase 69 — closes Spec 14 Q4).** The
moralMeter +1 above is the moral-axis shift. Independently, if the
befriended enemy carries
`friendshipReward.alignmentDelta?: Partial<PhilosophicalAlignment>`,
the END_COMBAT reducer ALSO threads the delta through
`applyAlignmentDelta` onto `state.philosophicalAlignment` (Phase 42's
3-axis cube). The two axes were filed as orthogonal at Phase 58 / 63
and remain so by design — `moralMeter` is the compassion ↔ ruthlessness
narrative axis; `philosophicalAlignment` is the Logic / Outlook / Scope
cube. Phase 69 just makes the friendship outcome a hook for BOTH
shifts when the per-enemy authoring opts in. First authored deltas:
MournfulGull `{ outlook: +3 }`; HollowEyedBeggar `{ scope: -3 }`. See
`docs/oaths.md` for the cube + `docs/enemy.md` § "Befriendable
enemies (Phase 60)" for the per-enemy authoring table.

```ts
// Triggered automatically in END_COMBAT when the outcome is 'friendship'
// (Befriend + spare authorization; Enemy.befriendabilityConfig gates per Phase 68).
if (outcome === 'friendship') {
    return shiftMoralMeter(baseState, 1);
}
```

### Dialogue: Flag-Based Processing

Dialogue choices can set flags that trigger moral meter shifts. The system
maps specific flag names to moral deltas:

```ts
const MORAL_FLAG_EFFECTS = {
    'beggar_generous_gift': 5,      // Major generous act
    'beggar_small_gift': 1,         // Minor kindness
    'beggar_kind_gesture': 3,       // Moderate compassion
    'beggar_dismissed': -1,         // Minor callousness  
    'beggar_harsh_words': -5,       // Major cruelty
};
```

When `applyDialogueChoice` sets a flag with a moral effect, the meter shifts
automatically and the effect is logged for UI feedback.

### API Surface

**Store Actions:**
```ts
store.getState().shiftMoralMeter(delta, gating?);
```

**Selectors:**
```ts
const currentMeter = selectMoralMeter(store.getState());
```

**Low-level dispatch:**
```ts
dispatch({ type: 'SHIFT_MORAL_METER', payload: { delta, gating } });
```

## Demo Content

### The Coastal Beggar

The fishing village (node `fv-7`) features a beggar encounter demonstrating
the full moral choice spectrum:

| Choice | Delta | Cost | Narrative Outcome |
|--------|-------|------|-------------------|
| Give 10 gold generously | **+5** | 10 gold | Major act of charity |
| Give 5 gold | **+1** | 5 gold | Simple kindness |
| Share rations | **+3** | None | Meaningful gesture |
| Walk away dismissively | **-1** | None | Callous indifference |
| Harsh words | **-5** | None | Active cruelty |

Each choice sets a unique flag (`beggar_generous_gift`, `beggar_harsh_words`, 
etc.) that other content can reference, creating lasting consequences beyond 
the immediate moral shift.

## Future Expansions

The current implementation (Phase 92) includes moral choice tracking and friendship
bonuses. Future phases will expand the system:

- **Multi-axis morality:** Honor, cunning, and compassion as separate tracks
- **NPC reputation:** Per-character relationship scores
- **Ending gates:** Multiple conclusions based on moral standing
- **Card restrictions:** Alignment-locked abilities and equipment
- **Advanced scaling:** Non-linear curves, per-enemy overrides, loot scaling

## Save Compatibility

**Version Migration:** Save files are migrated from v2 to v3 automatically.
Existing saves default to `moralMeter: 0` (neutral), preserving progress while
enabling moral tracking for future choices.

The migration is transparent—players with existing saves can continue their
journey without interruption, and their moral meter will begin tracking
from their first post-migration choice.

## Technical Notes

- **Pure reducers:** All moral meter changes flow through `shiftMoralMeter`
- **Event-driven:** Dialogue effects trigger via flag mapping  
- **Bounds-safe:** Automatic clamping prevents overflow/underflow
- **Testable:** Complete e2e test coverage in `moral.meter.engine.test.ts`
- **Persistent:** Moral meter is included in save/load operations

## See Also

- [`src/Game/e2e/moral.meter.engine.test.ts`](../src/Game/e2e/moral.meter.engine.test.ts) — moral choice test coverage
- [`src/World/dialogue.runtime.ts`](../src/World/dialogue.runtime.ts) — flag-to-moral-shift processing
- [`src/World/Continents/Coastal-Village/maps.ts`](../src/World/Continents/Coastal-Village/maps.ts) — beggar demo content
- [`specs/10-moral-difficulty-meter.md`](../specs/10-moral-difficulty-meter.md) — original implementation spec