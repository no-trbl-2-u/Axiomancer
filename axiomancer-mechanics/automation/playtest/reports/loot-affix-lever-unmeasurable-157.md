# Finding: Phase 157's `loot.statusAffixDrawBias` lever is unmeasurable by the combat matrix

**Date:** 2026-06-20 · **Source:** continuous-tuning watchdog re-tune after
Phase 157 (`a7b3168 feat(items): affix rolls feed status-effect play`) landed on
`main`. Third instance of the harness gap recorded in
`combat-harness-gap-status-interactions.md` (merged via #182).

## What Phase 157 added

A new combat-tuning registry lever:

```
loot.statusAffixDrawBias  (multiplier, category 'loot', current = 3, min 1, max 6,
  step 0.5, magnitudeCapPct 0.5, effect { engagement: 'raises' },
  tags ['loot','affix','status-effect','engagement'])
```

Its own rationale: _"At 1 the affix pool is flat-stat dominated (a doctrine
failure); raising it makes status weapons/gauntlets the expected affix roll so
loot feeds status-effect play. **Engagement-positive; touches drop naming/mods
only, not combat math.**"_

## The problem

The lever is registered in the **combat-tuning** registry (so the combat A/B loop
will repeatedly pick it up), but it is **structurally unmeasurable by the combat
matrix**:

- `src/Tuning/loadout.builder.ts` contains **no** affix/loot-roll usage
  (`grep affix|rollModifiers|generateLoot|STATUS_AFFIX` → 0 hits). The matrix's
  characters are built with fixed, deterministic gear — they never roll loot, so
  the draw-bias never applies.
- The lever's own rationale confirms it "touches drop naming/mods only, not
  combat math" — i.e. it affects the loot-generation pipeline, which the combat
  simulation does not exercise.

**Empirical confirmation:** A/B `loot.statusAffixDrawBias 3 → 4.5` (max-up within
the 50% cap) returned **"Baseline healthier; keeping baseline"** with zero
improvement — the variant matrix is identical to baseline. The combat baseline is
also bit-identical across Phase 157 (0/36 in band, aggregate 0.0815, witness −11%,
worst defeat 96%) — unchanged from pre-155.

## Why it matters

1. **Registry hygiene:** a combat-registry lever the combat tuner can never apply
   will be A/B-tested and rejected every tick, then sit on cooldown — wasted A/B
   slots and misleading "considered but not applied" noise, forever.
2. **Same root cause as Phases 155/156:** the combat matrix does not model the
   systems the engine is now investing in for the status-effect doctrine —
   status-interaction amplification (156), resolution re-centering (155), and now
   the loot→affix→status pipeline (157). The doctrine's north star is
   increasingly built in production but increasingly invisible to its own tuning
   witness.

## Recommendation (propose-only — needs T)

Two coherent options:
- **Move `loot.statusAffixDrawBias` out of the combat-tuning registry** into a
  loot/economy tuning surface whose objective actually measures affix-draw
  outcomes (drop composition, status-affix share), OR
- **Make the combat matrix roll loadouts through the affix pipeline** (so
  `loadout.builder` consumes `generateLoot`/`rollModifiers` under the draw-bias),
  which would also let the matrix witness Phases 155/156 effects carried on rolled
  gear. This is the broader harness fix already recommended in
  `combat-harness-gap-status-interactions.md`.

Either way, the lever should not remain a no-op resident of the combat registry.
No numeric change applied this tick (the only candidate was unmeasurable).
Hazard (25/25) and gathering (13/13) bands remain green on the Phase 157 tree.
