# Phase 130 — l15 timeout-cell fix (l15-mixed-easy / l15-strategist-normal)

> **Balance fix targeting specific timeout cells.** Close l15-mixed-easy and l15-strategist-normal cells that remain at ~0% resolution with STRATEGIST engagement 2.9–5.1% after Phase 126 strengthening. Lower resolution thresholds further, strengthen l15-tier enemy befriendability configs to open the mercy route, and tune STRATEGIST to improve status-effect targeting at l15 difficulty.

## Outcome

The two l15 timeout cells (`l15-mixed-easy` and `l15-strategist-normal`) move from ~0% resolution into the healthy band (≥40% resolution floor) WITHOUT collapsing engagement (floor ≥40%). Values/registry tunables and befriendability configs only — no formula rewrites. If cells cannot be closed with these levers, surface to T before touching core resolution mechanics.

## Source spec

No specific implementation spec — this is a balance/tuning phase per oversight directive 2026-06-09. References the Phase 126 resolution threshold patterns and Phase 129 verification that confirmed these cells remain unresolved after prior strengthening efforts. The T oversight directive provides specific target parameters and constraints.

## Implementation units

### Unit 1 — Lower resolution thresholds further (values-only)

**Files:**
- `src/Game/game-mechanics.constants.ts` (`EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD`, `EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD`)

**Work:**
- Lower `EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD` from current 4 to 3 (Phase 126 went 6→4, continue the trend)
- Lower `EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD` from current 3 to 2 (Phase 126 went 5→3, continue the trend)
- These values are already tunable in the registry; no new registry entries needed
- Target the specific l15 difficulty band where status effects are engaged but not resolving

### Unit 2 — Strengthen l15-tier enemy befriendability configs

**Files:**
- `src/Enemy/enemy.library.ts` (entries with level 15 or nearby levels)
- Search for enemies at l15 difficulty band that may need befriendability config adjustments

**Work:**
- Identify l15-tier enemies that appear in the timeout cells
- Lower their `befriendabilityConfig.hpThresholdPercent` values to open mercy route sooner
- Increase their `befriendabilityConfig.friendshipIncrement` values to accelerate friendship buildup
- Focus on enemies used in mixed-easy and strategist-normal scenarios at l15 difficulty

### Unit 3 — STRATEGIST status-effect targeting improvements at l15

**Files:**
- `automation/playtest/strategist/` configuration files (if any)
- Potentially `src/Tuning/tunable.registry.ts` if new tunables needed for status effect selection weights

**Work:**
- Review STRATEGIST AI configuration for l15 difficulty targeting
- Improve status-effect skill prioritization in the l15 band where engagement is low (2.9–5.1%)
- Ensure STRATEGIST applies effects that actually contribute to resolution thresholds
- May require tuning effect base intensity or proc intensity for better targeting

### Unit 4 — Hermetic e2e + verification against target cells

**Files:**
- `src/Effects/e2e/resolution-thresholds.engine.test.ts` (new or extend existing)
- `src/Combat/e2e/timeout-cell-regression.engine.test.ts` (new)

**Work:**
- Test that lowered thresholds (3/2 instead of 4/3) allow resolution in l15 scenarios
- Test befriendability config changes produce faster mercy route engagement
- Create deterministic scenario hitting the new thresholds with RNG stubbed
- Verify no regression in engagement metrics for other difficulty/playstyle combinations

## Decisions made upfront — DO NOT ASK

- **D1 — Threshold targets**: Move to 3/2 from 4/3 (debuff intensity/DoT damage) based on Phase 126 pattern continuation
- **D2 — Befriendability scope**: Focus on l15-tier enemies only; do not change global befriendability mechanics
- **D3 — STRATEGIST tuning scope**: Values and targeting weights only, no AI logic rewrites
- **D4 — Doctrine guard**: Must preserve status-effect engagement floor (≥40%) while closing resolution gaps
- **D5 — Stop condition**: If thresholds + befriendability cannot close cells, surface to T before formula changes

## Verify gate

- `npm run type-check`
- `npm test -- --run` (hermetic e2e for new thresholds + befriendability changes)
- `npm run verify` + `npm run deploy:check`
- Run `/combat-tuning` against both target cells after changes to confirm they move into band

## Commit body template

```
feat(balance): phase 130 — close l15 timeout cells via thresholds + mercy tuning

- Lower effects-resolution thresholds (debuff 4→3, DoT 3→2)
- Strengthen l15-tier enemy befriendability configs for faster mercy routes
- Tune STRATEGIST status-effect targeting at l15 difficulty band

Decisions:
- Threshold progression continues Phase 126 pattern (6→4→3, 5→3→2)
- Focused on l15-mixed-easy and l15-strategist-normal timeout cells specifically
- Values/config only per T directive — no formula rewrites

Addresses: l15-mixed-easy, l15-strategist-normal timeout cells (0% resolution post-Phase 126)
```

## Definition of Done

- [ ] `EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD` lowered from 4 to 3
- [ ] `EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD` lowered from 3 to 2
- [ ] L15-tier enemy befriendability configs strengthened (lower HP thresholds, higher friendship increments)
- [ ] STRATEGIST status-effect targeting improved for l15 difficulty band
- [ ] Hermetic e2e proves new resolution behavior in l15 scenarios
- [ ] Both target timeout cells move from ~0% into healthy resolution band (≥40%)
- [ ] Status-effect engagement preserved (≥40% floor maintained)
- [ ] Verify + deploy gates pass

## Follow-ups out of scope

- Global befriendability mechanics changes (separate phase if needed)
- Core resolution formula rewrites (escalate to T per D5 if values insufficient)
- Non-l15 difficulty band tuning (focus on other timeout cells in future phases)
- STRATEGIST AI logic architecture changes (values/weights only in scope)