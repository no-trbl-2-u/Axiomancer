> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/reports/rebaseline-scratch/reward-draft-evidence.md`. Describes removed or never-built code; not a source of rules.

# Reward-draft evidence — WS5.4 + WS6.3 (draft half)

**First Turn-Law-honest measurement at the reconciled tree.**

- HEAD: `e203fed9` (Phase 26 Turn Law + cloud reconciliation, incl. the Phase 28 Overtake 2-pip gate)
- Harness: `runRewardDraftSim` (`src/Combat/combat.reward-draft.sim.ts`), N=200 screens per run, seeds {1, 2, 3}, all 10 preset origins
- Sets measured: none (calibration baseline), `bridge-rewards`, `sequencing-microset`
- Raw counts: `reward-draft-raw.json` (runner: `reward-draft-runner.ts`, tabulator: `reward-draft-analyze.js`)
- All rates below are **mean pick rate over the 3 seeds** (% of 200 screens); "conv" = picks/offers summed over 3 seeds.

## 0. Harness fidelity caveats (read first)

1. **Twin-origin collapse.** The sim's behavior is fully determined by (archetype, focus). Two preset pairs share both: **erosion ≡ penitent** (body/dot) and **augury ≡ refrain** (mind/balanced) — their runs are **byte-identical** at every seed and set (verified). The 10 origins are only **8 distinct witnesses**. Any gate reading "≥2 distinct origins" is counted here over distinct (archetype, focus) classes; a twin pair counts ONCE. A letter-of-the-gate pass that rests solely on a twin pair is flagged, not credited.
2. **Offer-starvation confound.** Pick rate is capped by offer rate, and the reward roll's archetype 2× bias + rarity weights starve off-archetype uncommons/rares: several bridge×parent cells are offered on <3.5% of screens (e.g. entered-into-evidence at oratory: 3.3%; unbroken-countenance at bastion: 2.2%). An absolute pick-rate floor structurally punishes the off-archetype parent regardless of appeal. Conversion (picks/offers) is reported beside every verdict so the synthesis stage can see the difference between "never wanted" and "never shown".
3. **The pick policy is condition-rider-blind.** `pickOffer` ranks by `focusWeight(focus, verbClass)` only; synergy riders (e.g. unbroken-countenance's `enemy-dealt-no-damage-last-round` gate) contribute nothing to simulated appeal.

## 1. Floor calibration: 5% is silly → **2.5%** (justified)

Baseline (no injection) per-origin library pick-rate spread:

| origin | archetype | focus | max | p90 | median(>0) | #cards ≥5% | #cards ≥2.5% |
|---|---|---|---|---|---|---|---|
| erosion / penitent | body | dot | 8.8% | 5.0% | 0.7% | 7 | 12 |
| oratory | heart | balanced | 5.0% | 2.5% | 1.2% | 1 | 11 |
| foundry | mind | utility | 6.7% | 4.3% | 0.8% | 3 | 13 |
| standstill | mind | control | 8.5% | 2.8% | 0.8% | 6 | 9 |
| augury / refrain | mind | balanced | 3.8% | 2.5% | 1.2% | 0 | 11 |
| tithe | mind | rush-execute | 8.7% | 4.5% | 0.5% | 6 | 19 |
| grace | heart | control | 10.3% | 3.5% | 0.7% | 4 | 10 |
| bastion | body | utility | 10.0% | 3.5% | 0.7% | 2 | 13 |

Why 5% fails as a floor:

- At augury/refrain **zero** of the 70 library cards reach 5% (max 3.8%); at oratory exactly one. A floor that no card can clear at 3 of 10 origins measures the pool's flatness, not a card's appeal.
- Several bridge×parent offer rates sit **below 5%** (caveat 2 above) — the floor exceeds the physical ceiling.
- Applied raw, 5% kills 5–6 of 6 bridges AND all 6 microset cards: zero discrimination.

**Calibrated floor: mean pick rate ≥2.5% (≥5 picks/200).** It is ≥2× the median library pick rate at every origin, sits at the p90 of the flattest (balanced) origins — i.e. "top-decile appealing even where picks smear" — and still requires beating two competing offers on ≥5 independent screens per seed. Parent/distinct-origin requirements are unchanged.

## 2. WS6.3 — bridge-rewards (gate: BOTH parent origins ≥2.5%)

Mean pick rate per origin (`*` = parent origin; twins shown once):

| bridge | eros/peni | oratory | foundry | standstill | aug/refr | tithe | grace | bastion |
|---|---|---|---|---|---|---|---|---|
| barbed-compliment | **0.0%*** | 1.0% | 0.3% | 4.5% | 0.5% | 3.5% | **7.5%*** | 0.3% |
| the-poured-rampart | 0.2% | 1.0% | **6.0%*** | 0.7% | 1.0% | 0.2% | 0.3% | **4.3%*** |
| interest-on-the-flesh | **1.5%*** | 1.2% | 0.7% | 3.2% | 1.2% | **2.5%*** | 2.8% | 1.5% |
| entered-into-evidence | 0.5% | **1.7%*** | 4.5% | 1.5% | **2.7%*** | 0.3% | 0.7% | 1.3% |
| stolen-cadence | 0.5% | 0.5% | 0.3% | **4.8%*** | **2.3%*** | 0.5% | 1.7% | 0.5% |
| unbroken-countenance | 0.0% | 2.5% | 1.0% | 0.2% | 0.3% | 0.0% | **1.2%*** | **1.8%*** |

Parent-cell conversion (picks/offers, 3 seeds summed):

| bridge | parent A | parent B |
|---|---|---|
| barbed-compliment | erosion 0% (0/26) | grace 66% (45/68) |
| the-poured-rampart | foundry 57% (36/63) | bastion 62% (26/42) |
| interest-on-the-flesh | penitent 23% (9/40) | tithe 68% (15/22) |
| entered-into-evidence | oratory 50% (10/20) | augury 47% (16/34) |
| stolen-cadence | standstill 97% (29/30) | refrain 47% (14/30) |
| unbroken-countenance | grace 22% (7/32) | bastion 85% (11/13) |

**Dominance check: none.** No bridge is a universal auto-pick (largest off-parent cell anywhere: 4.8%).

### Verdicts

| bridge | verdict | reading |
|---|---|---|
| **the-poured-rampart** | **PASS** | The only clean bridge: both parents at/above floor every seed (foundry 6.0/6.5/5.5%, bastion 6.0/4.0/3.0%), conversions 57%/62%, non-parents ≤1%. This is Foundry picking it 6% AFTER the Overtake 2-pip gate — first honest number. Promotion candidate. |
| **barbed-compliment** | **DEAD (killed)** | The affliction parent NEVER takes it — erosion 0/26 offers converted across all seeds. Single-parent: it is an 8th charm card wearing an affliction home. Real off-parent splash exists (standstill 4.5% @ 73% conv, tithe 3.5% @ 57%) — evidence for a re-home, not a bridge pass. |
| **interest-on-the-flesh** | **DEAD (killed)** | Penitent 1.5% (23% conv) — below floor and below three non-parents (standstill 3.2%, grace 2.8%). Tithe sits exactly at floor and unstable (4.0/1.5/2.0%). The flagged nearest-buildable-shape (Souls booked up front) does not read as akrasia to its own parent. High non-parent conversion (standstill 86%, grace 85%) says the body is mis-homed. |
| **entered-into-evidence** | **DEAD by gate (confounded)** | Augury passes (2.7%, all seeds ≥2.5%); oratory fails at 1.7% — but oratory converts 50% of offers and is offer-starved (mind-aspect uncommon vs heart 2× bias: shown on 3.3% of screens, pick ceiling < floor). Foundry, a non-parent, picks it most (4.5%, 79% conv). Killed as written; strongest retest candidate if the gate ever moves to conversion. |
| **stolen-cadence** | **FAIL (marginal)** | Standstill 4.8% with **97% conversion** (near auto-pick when offered); refrain 2.3% (3.5/1.5/2.0% — misses the floor by ≤1 pick/200 in 2 of 3 seeds, 47% conv). Fails the strict both-parents floor; both parents show genuine appetite. Recommend one more seed batch before the axe. |
| **unbroken-countenance** | **DEAD (killed)** | Zero parents at floor — the deadest. Grace 1.2% (22% conv); bastion converts 85% but the rank-4 rarity weight starves it to 2.2% of screens offered. Its condition rider is also invisible to the pick policy (caveat 3), so the sim was never going to price its real face. |

**Killed bridges: barbed-compliment, interest-on-the-flesh, entered-into-evidence, unbroken-countenance** (+ stolen-cadence as a marginal fail pending one more batch). **Survivor: the-poured-rampart.**

## 3. WS5.4 — sequencing-microset (gate: ≥2 distinct preset origins ≥2.5%, twins count once)

Mean pick rate per origin:

| card | eros/peni | oratory | foundry | standstill | aug/refr | tithe | grace | bastion |
|---|---|---|---|---|---|---|---|---|
| captatio-benevolentiae | 0.0% | 1.2% | **3.7%** | 0.3% | 0.7% | 0.0% | 0.7% | **4.5%** |
| in-medias-res | 2.2% | 1.8% | 0.7% | 2.0% | **2.7%** | **5.0%** | 1.5% | 0.3% |
| coda | 0.7% | 0.3% | 1.2% | **4.5%** | 2.2% | **3.7%** | 2.0% | 1.2% |
| dying-echo | **4.5%** | 0.8% | 0.3% | 0.5% | 0.7% | **5.8%** | 0.5% | 0.2% |
| wages-of-weakness | **4.5%** | 1.5% | 0.0% | 0.7% | 1.0% | 1.5% | 0.5% | 1.0% |
| answered-in-kind | **3.7%** | 1.0% | 0.2% | 0.2% | 0.3% | 2.2% | 0.7% | 0.3% |

### Verdicts

| card | verdict | distinct origin classes ≥2.5% |
|---|---|---|
| captatio-benevolentiae | **PASS** | foundry (3.7%, 67% conv) + bastion (4.5%, 71% conv) — the two utility-focus classes; the OPENING guard+premise face travels. |
| in-medias-res | **PASS** | tithe (5.0%, 77% conv) + augury/refrain class (2.7%, 41% conv); erosion/penitent at 2.2% just under. Broadest smear of the set. |
| coda | **PASS** | standstill (4.5%, 96% conv) + tithe (3.7%, 79% conv); augury/refrain class 2.2% just under. |
| dying-echo | **PASS** | tithe (5.8%, 50% conv) + erosion/penitent class (4.5%, 61% conv) — two genuinely distinct classes (mind/rush + body/dot). |
| wages-of-weakness | **FAIL (single class)** | Only erosion/penitent (4.5%, 96% conv) — a twin pair, i.e. ONE distinct witness; every other origin <2.5% (next: oratory/tithe 1.5%). Passes the gate's letter only via the twins (caveat 1). |
| answered-in-kind | **FAIL (single class)** | Only erosion/penitent (3.7%, 69% conv); tithe under floor at 2.2%. Same twin-only pattern. |

**WS5.4 draft half: 4 of 6 pass.** The two failures are exactly the two **after-cost** condition cards — both appeal only to the body/dot class that already pays blood prices. Their WS5.3 sequencing-test results should be read knowing their draft appeal is single-class.

## 4. Reproduction

```
cd axiomancer-mechanics
npx ts-node --transpile-only docs/reports/rebaseline-scratch/reward-draft-runner.ts
node docs/reports/rebaseline-scratch/reward-draft-analyze.js
```

Deterministic: same (origin, seed, screens, set) → identical counts (verified sim contract).
