# Phase 126 — Make status effects and skills stronger (resolution + impact)

> **Doctrine-load-bearing.** Make status effects meaningfully stronger along two axes: resolution contribution (lower thresholds so saturated enemies yield/die) and combat impact (raise potency so skills feel decisive). Addresses mid/late-game timeout cells where status-effect play is heavily engaged but never resolves.

## Outcome

Status effects and skills are meaningfully stronger along TWO axes: (a) resolution contribution — heavily-debuffed enemies actually yield or die instead of sitting at full timeout; (b) combat impact — status-effect potency raised so skills feel decisive, not just frequent. After the change, mid/late timeout cells (`l15-mixed-easy`, `l15-strategist-normal`, `l30-mixed-normal`) move from ~0% resolution into band WITHOUT collapsing status-effect engagement.

## Source spec

No specific implementation spec — this is a tuning/balance phase. References Phase 125 effects-resolution thresholds and Phase 124 status-effect strength patterns. The T oversight directive (2026-06-08) explicitly overrides loop-cooldown on the DoT direction and provides specific target threshold reductions.

## Implementation units

### Unit 1 — Lower effects-resolution thresholds (resolution contribution)

**Files:**
- `src/Game/game-mechanics.constants.ts` (`EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD`, `EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD`)

**Work:**
- Lower `EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD` from 6 to 4 (analyst proposed 8→6, oversight overrides to 6→4)
- Lower `EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD` from 5 to 3 (analyst proposed 5→3)
- These values are already tunable in registry; no new tunables needed

### Unit 2 — Raise status-effect potency (combat impact)

**Files:**
- `src/Effects/buffs.library.json` and related effect content files
- `src/Skills/library/*.ts` for skill effect payloads
- Key effects from tuning reports: `arrow-paradox`, `peaceful-gesture`, `appeal-to-consequences`, `gamblers-fallacy`

**Work:**
- Identify the core status effects used in the timeout cells (arrow-paradox, peaceful-gesture, etc)
- Raise base intensity and/or duration on these core debuffs/DoTs
- Focus on effects that show high engagement but low resolution impact
- Prefer tunable values over formula rewrites for loop compatibility
- Target 15-25% strength increase based on Phase 124 precedent

### Unit 3 — Add new tunables if needed

**Files:**
- `src/Tuning/tunable.registry.ts`
- `src/Tuning/e2e/registry-applier.engine.test.ts`

**Work:**
- If any strengthened base values should be loop-tunable but aren't yet, add registry entries
- Use `category: 'effect'`, `effect: { engagement: 'raises' }`, tight bounds
- Follow existing pattern from `effect.buff_regeneration.duration` JSON-data tunables
- Extend applier locator test to cover new entries

### Unit 4 — Hermetic e2e + verify against timeout cells

**Files:**
- `src/Effects/e2e/*.engine.test.ts` or `src/Combat/e2e/*.engine.test.ts`
- Tests specifically for the resolution thresholds and strengthened effects

**Work:**
- Test that lowered thresholds allow resolution where they didn't before
- Test that strengthened effects produce expected larger intensity/duration/damage
- Create e2e scenario that hits the new thresholds deterministically (RNG stubbed)
- Verify with spot-check against the three named timeout cells after changes

## Decisions made upfront — DO NOT ASK

- **D1 — Smallest-change-first:** Values/registry tunables only, no formula rewrites or new outcome union members
- **D2 — Threshold targets fixed:** 6→4 debuff threshold, 5→3 DoT threshold per oversight directive
- **D3 — Core effects priority:** Focus on arrow-paradox, peaceful-gesture, appeal-to-consequences, gamblers-fallacy from engagement data
- **D4 — Doctrine guard:** Must not make basic-attack trading more attractive than status play
- **D5 — Stop condition:** If thresholds + potency cannot close the cells, stop and surface to T before touching core resolution mechanics

## Verify gate

- `npm run type-check`
- `npm test -- --run` (hermetic e2e for thresholds + strengthened effects)
- `npm run verify` + `npm run deploy:check`
- Manual spot-check against timeout cells if time permits

## Commit body template

```
feat(effects): phase 126 — strengthen status effects (resolution + impact)

- Lower effects-resolution thresholds (debuff 6→4, DoT 5→3)
- Strengthen core status effects: [list specific effects modified]
- [Optional: Add new tunables for base effect strengths]

Decisions:
- Threshold targets from T oversight directive override analyst suggestions
- Focused on arrow-paradox, peaceful-gesture, etc per engagement data
- Preferred values over formulas for loop compatibility

Addresses: mid/late timeout cells (l15-mixed-easy, l15-strategist-normal, l30-mixed-normal)
```

## Definition of Done

- [ ] `EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD` lowered from 6 to 4
- [ ] `EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD` lowered from 5 to 3
- [ ] Core status effects strengthened (base intensity/duration raised 15-25%)
- [ ] Any new base-strength values added to tunable registry with tight bounds
- [ ] Hermetic e2e proves new resolution behavior + strengthened effect output
- [ ] Verify + deploy gates pass
- [ ] Status-effect engagement preserved (no basic-attack regression)

## Follow-ups out of scope

- Mechanics-tuning run against the timeout cells (happens after this ships)
- Formula rewrites or core resolution mechanics changes (escalate to T if needed)
- Enemy counterweight balancing (separate tuning loop iterations)