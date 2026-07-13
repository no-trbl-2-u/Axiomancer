# Non-Erosion preset baseline — 2026-07-13

**Status:** active tuning baseline  
**Excluded by owner:** Erosion  
**First calibrated preset:** Grace

## Measurement law

- Live `main` after the DoT-attribution and explicit-capitulation repair.
- `combat-playtest --stage=all --policy=all --runs=100 --cards --json`.
- Witness seeds: `1`, `7`, `19`.
- The player-authored capitulation choice is accepted by the simulation policy; no threshold crossing resolves an outcome implicitly.
- Primary actual-win target: **65–75%** across the full early roster and all eight legal policies.
- Stage-curve diagnostics remain secondary witnesses; they are not permission to ruin a healthy early actual rate.

## Non-Erosion screen

Seed 1, 60 runs per cell, full early roster, all policies:

- Oratory: **91.3%**
- Foundry: **66.9%**
- Penitent: **78.8%**
- Standstill: **81.5%**
- Augury: **67.7%**
- Tithe: **85.7%**
- Grace: **75.2%**
- Bastion: **85.2%**
- Refrain: **89.3%**

Grace is the clean first baseline because it sits on the target boundary and directly exercises the repaired SWAY → explicit-choice → capitulation protocol.

## Grace baseline

Across seeds 1 / 7 / 19, 100 runs per cell:

- Early actual win rate: **74.5% / 74.2% / 74.4%**.
- Mid: **0.0% / 0.0% / 0.0%**.
- Late: **0.0% / 0.0% / 0.0%**.
- Early outcomes are overwhelmingly explicit capitulations; direct VITAE victories are incidental.
- Early enemy spread is polarized: Grave Larva, Foot Stealer, Little Belle, and Water Holger are effectively solved; The Butcher is near-even; King of Revenge remains the hard wall.

**Verdict:** freeze Grace's shipped card values for the first tuning checkpoint. It is already inside the target band. A numeric change made merely to prove activity would be vandalism.

## Rejected perturbations

These were run locally and reverted before commit:

1. `soft-word` SWAY 3 → 4:
   - Seed-1 early: 74.7% → 76.9%.
   - Mid: 0.0% → 0.2%.
   - Rejected: pushed the healthy early band hot while doing nothing material for scaling.
2. Add SWAY 1 to the borrowed `second-thoughts`:
   - With the prior change, early rose to 78.0%; mid reached only 0.4%.
   - Rejected: contaminated Echo vocabulary and failed to solve Grace's stage wall.
3. Oratory `exordium` poison duration 2 → 1:
   - Early 92.3% → 92.1%; mid 49.6% → 48.7%; late 15.1% → 14.8%.
   - Rejected: negligible early correction and worsened the lower stages.

## Next live tuning target

**Oratory**, but not by shaving one starter-card number.

Its three-seed curve is stable:

- Early: **92.2–92.3%**.
- Mid: **49.4–49.9%**.
- Late: **15.1–15.3%**.

The early rate is too hot while the mid rate is already near doctrine and late is low. A flat nerf is therefore the wrong instrument. The next pass must reshape the curve: reduce early repeat-cast certainty while preserving or improving difficulty-scaled Peroration/CONCEDE reach. That requires a witnessed curve lever, not blind subtraction.
