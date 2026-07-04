# The Reliquary — Alternate Direction: Costed-Probe Hybrid (NOT IMPLEMENTED)

> Status: **backup spec, written but not built.** The shipped direction is
> the "Pick Pool" dice-pool lockpicking mechanic — see
> `docs/encounters/loot-cache.md`. This document exists so the hybrid
> direction (Option 5 from the 2026-07-03 design session,
> `braindump/2026-07-03-lockpicking-treasure-minigame.md`) is fully specced
> and ready to build if Pick Pool's playtest signal calls for a lighter-weight
> fallback.

## Why this exists

Two directions came out of the 2026-07-03 brainstorm: **Pick Pool** (a real
dice-pool skill check per layer, closer to Too Many Bones) and this
**Hybrid** (a much smaller diff: keep today's binary trap/no-trap layers, but
fix the two things that make them solved — pre-baked RNG and a free Probe).
Pick Pool was chosen as the primary build because it's more on-theme for a
system-mastery RPG and gives the player a genuinely tactile moment. This
Hybrid is the fallback if Pick Pool turns out to be too heavy (engineering
cost, UI complexity, or playtest friction) — it delivers most of the "live
risk" fix for a fraction of the surface area.

## Core change from today's engine

1. **Lazy trap resolution.** `createLootCacheSession` no longer rolls each
   layer's `trapped` fate at creation. Instead, each `LootCacheLayerState`
   keeps its existing `trapChance` (public or not — see open question below)
   and the roll happens **at the moment `delveLootCache` is called**, using
   the session's threaded RNG state. Nothing about a layer's fate exists
   before the player commits to opening it.
2. **Costed, imperfect Probe.** Today's Probe is free and returns a certain
   answer (`trapped: true/false`). In the hybrid, Probe:
   - Costs 1 VITAE per use (paid immediately, whether or not you delve
     afterward).
   - Is available **once per layer** instead of once per session (raises the
     total information budget, but each use has a real cost, unlike today).
   - Returns an imperfect signal instead of certainty: a "warm" or "cold"
     read, computed as `trapChance[i] > 0.4 ? 'warm' : 'cold'` XOR'd with a
     small chance (e.g. 15%) of being deliberately wrong. This keeps some
     tension even after probing — the read is evidence, not a guarantee.

## Types (diff against today's `lootcache.types.ts`)

```ts
export interface LootCacheLayerState {
    index: LootCacheLayerIndex;
    name: string;
    flavor: string;
    trapChance: number;      // now PUBLIC — no more hidden trapped/revealed flags
    trapBite: number;
    probed: boolean;         // this layer's probe has been spent
    probeReading: 'warm' | 'cold' | null;   // last imperfect reading, null if never probed
    opened: boolean;
    spoiled: boolean;
    loot: LootCacheLayerLoot;
}

export interface LootCacheSession {
    phase: LootCachePhase;   // UNCHANGED shape: intro | delving | card | outcome | done
                              // (no 'picking' phase needed — this is a much
                              // smaller diff than Pick Pool)
    layers: readonly LootCacheLayerState[];
    depth: number;
    bittenVitae: number;      // now also accrues probe costs, not just trap bites
    card: LootCacheCard | null;
    outcome: LootCacheOutcome | null;
    seed: SeedInput;
    rng: LootCacheRngState;
}
```

## Engine transitions (diff)

- `createLootCacheSession`: drop the upfront `nextFloat` draws entirely.
  Layers are seeded with `trapChance` from tuning, `probed: false`,
  `probeReading: null`.
- `delveLootCache(s)`: **this is where the roll now happens.** Draw
  `nextFloat(s.rng)`, compare against `layer.trapChance` — trapped or clean
  resolves exactly as today's card logic already does, just moved here
  instead of read from a pre-set flag. Thread the advanced RNG state back
  onto the session.
- `probeLootCache(s)`: now takes no "which layer" ambiguity (still always the
  next unopened layer) but: guard changes from `!s.probeUsed` (session-wide)
  to `!layer.probed` (per-layer); deducts 1 VITAE into `bittenVitae`
  immediately; computes the warm/cold reading via a second RNG draw (for the
  15% deliberate-miss chance) rather than reading a stored boolean.
- `sealLootCache`, `continueLootCacheCard`, `finishLootCache`,
  `claimLootCacheOutcome`: unchanged.

## Tuning additions

```ts
export const LOOT_CACHE_TUNING = Object.freeze({
    trapChance: [0, 1 / 3, 1 / 2] as readonly number[],   // unchanged values
    trapBite: [0, 2, 3] as readonly number[],
    probeCost: 1,            // VITAE per probe
    probeMissRate: 0.15,     // chance a probe's reading is deliberately wrong
    probeWarmThreshold: 0.4, // trapChance above this reads 'warm'
    falseBottomBonus: 0.5,
    tithesBonus: 1.0,
    falseBottomFloor: 3,
});
```

## Trade-offs (carried over from the braindump, refined)

**Pros over today's engine:** genuinely live risk (nothing is predetermined
before the player acts), Probe becomes a real bet instead of a free reveal,
near-zero new UI surface (no dice tray, no progress meter, no new phase) —
ships almost entirely as an engine-layer PR.

**Cons vs. Pick Pool:** doesn't deliver the "tactile, visually engaging"
ask directly — there's no new physical interaction, just better-tuned
numbers behind the same three buttons. If the goal is "make lockpicking
*feel* like something," this alone under-delivers; it would need Option D
(Layered Reveal tap-sequence) or a lighter visual treatment layered on top
to hit the tactile bar Pick Pool clears natively.

**Failure mode to watch if built:** if `probeMissRate` is tuned too low, the
per-layer probe becomes strictly correct often enough that players probe
every layer and the VITAE cost undertunes against the certainty it buys —
right back to solved play, just slower. If tuned too high, probing becomes
actively misleading often enough that rational players stop using it,
wasting the whole mechanic.

## Open questions if this gets built

- Should `trapChance` be shown to the player at all times (fully public,
  "you can see the mechanism is rusted, this one looks bad") or only
  revealed by a probe? Full transparency leans more strategic/legible;
  hidden-until-probed keeps more of today's tension but reintroduces a
  hidden-information leak boundary the presenter has to enforce (the shipped
  Pick Pool rule is recorded in `docs/adr/ADR-0008-loot-cache-pick-pool.md`;
  if this hybrid ever ships instead, write a superseding ADR).
- Does per-layer Probe (3 possible uses/session) outweigh the value of Pick
  Pool's single Insight charge enough to feel generous rather than
  interesting? May need a session-wide cap (e.g. max 2 probes total) even
  though each layer offers one.
