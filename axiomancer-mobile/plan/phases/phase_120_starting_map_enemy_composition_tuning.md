# Phase 120 — Starting-map enemy composition tuning (difficulty entry fix)

## Outcome

Rebalance fishing village enemy encounter weights to provide a gentler difficulty entry for new players, ensuring the first encounter is survivable and appropriately scaled.

## Why

User feedback identified that the opening experience is too punishing because fishing-village enemies rubber-band to player level, making level-1 encounters feel immediately overwhelming. While the engine controls global level derivation, mobile controls which enemies appear via event-pool registration.

## Routes / API endpoints / CLI surface

No new routes. Modifications are contained within the existing event-pool registration system at `state/exploration-maps/event-pools.ts`.

## Content / data reads

No new content reads. Leverages existing `FISHING_VILLAGE_ENCOUNTERS` array and `multiEncounterPool` function.

## Components / handlers

**Reused primitives:**
- `WeightedEnemy` interface (existing)
- `multiEncounterPool` function (existing)
- `registerExplorationEventPools` function (existing)

**Modified:**
- `FISHING_VILLAGE_ENCOUNTERS` array weight distribution

**New (if needed):**
- Per-node encounter overrides for opening 2-3 nodes (optional approach)

## Cross-links

**In (verify):** 
- `state/e2e/event-pools.engine.test.ts` tests must remain green
- Existing encounter pool registration contract preserved

**Out (ship):**
- No cross-links to other families
- Internal change only

**Retro-fit:**
- None required (internal tuning)

## SEO / metadata / output schema

Not applicable - internal game balance change.

## Hero / body / sub-section composition

Not applicable - backend tuning change.

## Empty / loading / error states

No new states. Existing error handling in event resolution remains unchanged.

## Decisions made upfront — DO NOT ASK

1. **Primary approach:** Increase weight bias toward simple-tier enemies (`tidepool-crab`, `sea-mist-wisp`) in the global fishing village pool rather than per-node overrides
2. **Weight distribution:** Change from current 3:3:1:1 (simple:simple:normal:normal) to 5:5:1:1 or 6:6:1:1 for stronger bias toward starter enemies
3. **Scope limitation:** Keep changes minimal - adjust existing weights rather than adding new enemies or complex per-node logic
4. **Northern forest:** Leave northern-forest encounters unchanged as they're already appropriately balanced for mid-game progression
5. **Boss encounters:** Leave boss pools untouched - they're intentionally challenging signature encounters

## Mobile reflow / responsive / paginate / output limits

Not applicable - game balance change has no UI implications.

## Pages × tests matrix

**Modified files:**
- `state/exploration-maps/event-pools.ts` (weight adjustments)

**Test coverage:**
- `state/e2e/event-pools.engine.test.ts` (existing contract verification)
- New hermetic test for starter-tier enemy bias in first encounter nodes

## Verify gate

```bash
pnpm typecheck  # Ensure type safety
pnpm test       # Unit tests including updated hermetic pool tests  
pnpm verify     # Full verification including e2e
```

**Custom verification:**
- Hermetic test pins that first fishing-village encounter node resolves starter-tier enemy across 20 seeded RNG samples
- Manual confirm that level-1 play feels survivable (optional)

## Commit body template

```
feat: fishing village enemy composition rebalancing

- Increase weight bias toward starter enemies (tidepool-crab, sea-mist-wisp)
- Reduce effective probability of normal-tier enemies in early encounters  
- Add hermetic test ensuring first encounters favor starter-tier enemies
- Addresses user feedback about punishing opening difficulty

Decisions:
- Chose weight adjustment over per-node overrides for simplicity
- Targeted 5:5:1:1 weight distribution for stronger starter bias
- Left northern-forest unchanged as mid-game progression is appropriate
```

## DoD

- [ ] `FISHING_VILLAGE_ENCOUNTERS` weights rebalanced toward simple-tier enemies
- [ ] Hermetic test added verifying starter-tier bias in early encounter sampling
- [ ] Existing encounter pool tests remain green
- [ ] Manual verification of survivable level-1 opening experience (optional)
- [ ] Build plan marked shipped with commit hash

## Follow-ups (out of scope)

- Consider per-node enemy overrides for ultra-fine-grained control (if global reweighting proves insufficient)
- Evaluate northern-forest difficulty curve if similar feedback emerges
- Engine-side difficulty scaling improvements (separate from mobile encounter selection)