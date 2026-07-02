# axiomancer-mechanics: 0.15.0 → 0.15.1 upgrade guide for mobile

> Status: **published**. npm registry confirms `axiomancer-mechanics@0.15.1`.
> This is the manual-build handoff release for the latest mechanics pass.

---

## TL;DR

- Bump `axiomancer-mechanics` from `0.15.0` to `0.15.1`.
- Status effects are now the dominant path to combat resolution: DoT erosion can end in `victory`; saturation/debuff pressure can end in `friendship`.
- Mobile must display mechanics-emitted Stance, Vitae, affordability, action resolution, active effects, and combat reports. Do **not** simulate status-resolution thresholds locally.
- Use `getEffectsResolutionOutcome(combatState)` for effect-driven resolution truth when mobile needs a preview/debug/presenter hook.
- Replace any import of `clearTier1EffectsForType` with `clearTier1EffectsForStance`.

---

## Release contents mobile must account for

## 1. Stronger status effects and skills

**Mechanics change:** Phases 124 and 126 raised core effect intensity, duration, DoT pressure, debuff/buff impact, and key skill proc magnitudes. T's threshold override is live: DoT threshold `5 → 3`, debuff intensity threshold `8 → 6`.

**Mobile action:**

- Make active effects prominent enough for manual playtesting. Status-effect play should feel decisive, especially for STRATEGIST-style runs.
- Do not hide, abbreviate, or down-rank effect stacks in combat UI.
- If status effects feel invisible in the build, file it as a mobile presentation defect rather than compensating with local mechanics.

## 2. Effect-driven combat resolution

**Mechanics change:** Phase 125 added engine-owned status resolution. Saturation/debuff pressure can yield the encounter through the existing `friendship` outcome; DoT erosion can end it through the existing `victory` outcome. No new `CombatEndReport.outcome` union member is required.

**Mobile action:**

- Use engine report/outcome state as truth.
- Use `getEffectsResolutionOutcome(combatState)` only as a read helper; do not approximate thresholds in mobile.
- Confirm victory/friendship screens and battle log copy still make sense when the final cause is status pressure rather than direct attack damage.

## 3. Enemy stat-budget export and late-game balance

**Mechanics change:** Phase 123 exports `enemyStatBudget(level, difficulty)` and gear-tier counterweight constants. These help explain enemy stat generation and late-game balance.

**Mobile action:**

- Optional: use `enemyStatBudget` for debug overlays or encounter-preview diagnostics.
- Do not make public UI promises around exact enemy stat math until the presentation is explicitly designed.

## 4. Content expansion

**Mechanics change:** The package includes new skill content and a larger equipment/item template library.

**Mobile action:**

- Confirm skill lists, descriptions, item cards, equipment fallbacks, and combat presenters tolerate the expanded libraries.
- Preserve the existing skill-access doctrine: learned/unlocked + currently affordable engine state, not legacy equipped-slot gating.

## 5. Removed alias

**Mechanics change:** `clearTier1EffectsForType` was removed from the public barrel. `clearTier1EffectsForStance` is the canonical replacement with identical behavior.

**Mobile action:**

- Search for `clearTier1EffectsForType` and replace it if present.

---

## Required verification for manual-build readiness

```bash
npm run typecheck
npm test -- --runInBand
npm run verify
npm run verify:visual
```

If visual smoke exits on missing baselines after a clean export/console pass, report baseline debt. If it exits on console/runtime errors, fix those before calling the build ready.

---

## Out of scope

- Designing final status-effect UX polish beyond making current truth visible.
- Local mobile simulation of combat math or status thresholds.
- Broad combat UI redesign unrelated to the package bump.
