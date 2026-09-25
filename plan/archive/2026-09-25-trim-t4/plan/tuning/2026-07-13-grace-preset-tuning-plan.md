# Grace Preset Tuning Plan

> **Status: HISTORICAL / SUPERSEDED (2026-08-09).** The Profane Canon
> (`84ef85bd`) retired Grace and the former ten theme presets. The current
> shipped campaign presets are `threadbare`, `pilgrim`, and `apostate` in
> `combat.starter-deck-presets.ts`. Do not execute this plan or use its gates to
> tune current main; preserve it as evidence of the retired campaign.
>
> **For Hermes:** Tune this preset alone. Do not screen, modify, or plan another preset in this file.

**Goal:** Calibrate Grace against the full encounter curve while preserving its explicit SWAY → ACCEPT / CONTINUE → CAPITULATE identity.

**Architecture:** Treat the shipped Grace list as the marker. Verify the full roster and all legal policies at three deterministic seeds, identify whether failures come from witness behavior, card composition, or stage scaling, and change only the smallest Grace-owned parameter that improves a failed gate without pushing a healthy gate outside doctrine.

**Tech Stack:** TypeScript, Vitest, `combat-playtest`, Axiomancer mechanics preset/card libraries.

---

## Scope

**Preset:** `grace` only
**Theme:** Charm
**Primary path:** SWAY, RAPPORT, explicit capitulation choice
**Excluded:** Every other preset, including Erosion and Oratory

### Shipped deck — current static recipe

- 4 × `soft-word`
- 4 × `second-thoughts`
- 2 × `the-olive-branch`
- 2 × `grace-under-fire`
- 1 × `irresistible-grace`
- 1 × `ouroboros`
- 1 × `crumbling-resolve`

Under the normal Upgradeable-Dice model, Grace's valve replaces one
`soft-word` with one `change-of-heart`. Effective play is therefore
`3 × soft-word`, `1 × change-of-heart`, and the remaining static recipe above.
All new marker and decomposition evidence must declare `diceModel: upgradeable`
and reason about this effective deck rather than the pre-valve list.

## Historical marker — reproduction required

**Recorded marker base:** `ddec4adc`
**Current implementation base:** `13b58c8d`

The hand-retention and RIPOSTE work that landed in `13b58c8d` advanced combat
after this marker was recorded. Treat the rates below as historical evidence
until Task 1 reproduces them on the current implementation.
**Command shape:**

```bash
npm run combat-playtest -- \
  --stage=all \
  --policy=all \
  --deck=preset:grace \
  --runs=100 \
  --seed=<1|7|19> \
  --cards \
  --json
```

Three-seed results:

- Early actual win rate: **74.5% / 74.2% / 74.4%**
- Mid actual win rate: **0.0% / 0.0% / 0.0%**
- Late actual win rate: **0.0% / 0.0% / 0.0%**
- Early victories are overwhelmingly explicit capitulations.
- Grave Larva, Foot Stealer, Little Belle, and Water Holger are effectively solved.
- The Butcher is near-even.
- King of Revenge is the early hard wall.

## Gates

1. Aggregate early **actual** win rate: **65–75%**.
2. STRATEGIST/status witness: **≥80% actual wins**.
3. Every other canonical policy: **≥65% actual wins**, unless T narrows the gate.
4. Capitulation must remain player-authored:
   - SWAY reaches resolve.
   - `capitulation-offered` is emitted.
   - ACCEPT produces `capitulate`.
   - CONTINUE does not end combat and does not reopen the same offer.
5. Grace must not acquire direct-damage leakage merely to improve win rate.
6. No global SWAY, RAPPORT, threshold, or status-clock rule changes without T approval.

## Known rejected changes

These experiments were run and reverted. Do not repeat them without new evidence.

1. `soft-word` SWAY 3 → 4:
   - Seed-1 early: 74.7% → 76.9%.
   - Mid: 0.0% → 0.2%.
   - Rejected because it pushed the healthy early band hot without solving scaling.
2. Add SWAY 1 to borrowed `second-thoughts`:
   - With the prior change, early reached 78.0%; mid reached 0.4%.
   - Rejected because it contaminated Echo vocabulary and failed to solve the stage wall.

---

### Task 1: Reproduce the Grace marker

**Objective:** Prove the plan still starts from the recorded live baseline.

**Files:**
- Read: `axiomancer-mechanics/src/Combat/combat.deck-presets.ts`
- Read: `axiomancer-mechanics/src/Combat/combat.playtest.ts`
- Create: disposable `/tmp/grace-marker-{1,7,19}.json`

**Steps:**

1. Print branch, status, and SHA from the repository root.
2. Confirm `main` equals `origin/main` and the worktree is clean.
3. Run the marker command for seeds 1, 7, and 19.
4. Verify the CLI echoes `deck=preset:grace`, all policies, all stages, the requested seed, and 100 runs.
5. Compare early/mid/late rates to the marker above.
6. If the base commit advanced, label the old marker stale and record the new SHA and deltas before tuning.

### Task 2: Break Grace down by difficulty and policy

**Objective:** Determine which exact Grace gates pass and which witnesses or encounters fail.

**Files:**
- Read: `axiomancer-mechanics/src/Combat/combat.encounter.sim.ts`
- Read: `axiomancer-mechanics/src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`
- Update: this plan's evidence ledger below

**Steps:**

1. Aggregate actual wins and run counts for each stage.
2. Within each stage, report every enemy separately.
3. Within each enemy, report every legal policy separately.
4. Convert percentage gates into integer win-count gates.
5. Report average rounds, defeat rate, explicit capitulation count, deck utilization, line-use ratios, and SWAY/RAPPORT engagement where exposed.
6. Classify each failure as witness, parameter/content, or mechanics.
7. Stop if a stale witness is responsible; repair the witness before judging Grace.

### Task 3: Audit Grace's card economy

**Objective:** Find the smallest Grace-owned lever with a credible chance to improve a failed gate.

**Files:**
- Read: `axiomancer-mechanics/src/Combat/combat.deck-presets.ts:grace`
- Read: `axiomancer-mechanics/src/Cards/cards.library.ts`
- Read: `axiomancer-mechanics/src/Combat/combat.engine.ts`
- Test: `axiomancer-mechanics/src/Combat/e2e/themed-decks.engine.test.ts`
- Test: `axiomancer-mechanics/src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts`

**Steps:**

1. Inspect FREE/PAID use for every card in the effective Upgradeable-Dice Grace deck, including the `change-of-heart` valve.
2. Confirm whether `grace-under-fire` and `change-of-heart` are reached and used under the failing policies before changing card economy.
3. Measure how often `irresistible-grace`, `ouroboros`, and `crumbling-resolve` enter play before defeat.
4. Measure whether failures die from inadequate RAPPORT/Guard, SWAY decay, inaccessible paid lines, or an unreachable resolve target.
5. Select one Grace-owned lever only.
6. Reject any lever that changes another theme's identity or global combat rules.

### Task 3A: Audit Grace card wording

**Objective:** Ensure every unique card in the Grace preset and every Charm-library card states its complete FREE and PAID payload using defined vocabulary.

**Result:** Complete on the current working tree.

- `soft-word` — clear; no rewrite needed.
- `disarming-smile` — its HEAL rider was hidden; projection fixed.
- `common-ground` — clear once its draw, RAPPORT, and SWAY clauses are projected together.
- `heart-of-the-matter` — its non-ECHOed HEAL rider was hidden; projection fixed and distinguished from the ECHOed SWAY.
- `mirror-of-longing` — grammar now says damage *prevented by* GUARD or RIPOSTE becomes SWAY.
- `second-thoughts` — its PAID MARK-consumption rider was mechanically real but absent from projected card text; projection fixed.
- `the-olive-branch` — its PAID CLEANSE/HEAL rider was hidden; projection fixed. Flavor now says “truce” rather than the separate Mercy/Befriend concept.
- `measured-answer` — clear under the registered GUARD/RIPOSTE definitions; no rewrite needed.
- `irresistible-grace` — now states the exact end-of-turn timing, future-gain scaling, and +108% cap.
- `ouroboros` — its PAID MARK-consumption rider was hidden; projection fixed. Flavor now matches “last spell twice” rather than implying the entire spell history repeats.
- `crumbling-resolve` — now names the threat-phase clock, remaining-GUARD basis, minimum damage, and STAGGER 1 amount.

**Witness:** `src/Combat/e2e/grace-card-wording.engine.test.ts` projects all eleven unique preset-or-Charm-library cards through `toCombatCard` and pins every material clause.

### Task 4: Run one bounded perturbation

**Objective:** Test one evidence-backed parameter/content change without contaminating the baseline.

**Files:**
- Modify only the exact Grace-owned card or Grace preset entry selected in Task 3.
- Test the nearest themed-deck and card-library witnesses first.

**Steps:**

1. Write or update a focused failing test for the intended Grace behavior.
2. Run that test and prove it fails for the expected reason.
3. Make the smallest implementation change.
4. Run the focused test and prove it passes.
5. Run a one-seed, 100-run full-roster screen.
6. If the change misses the blocked gate, pushes early above 75%, adds direct-damage leakage, or harms policy floors, revert it immediately.
7. Only if the screen improves the intended gate, run seeds 1, 7, and 19.

### Task 5: Close or freeze Grace

**Objective:** Produce a truthful Grace-only verdict.

**Files:**
- Update: `plan/tuning/2026-07-13-grace-preset-tuning-plan.md`
- Modify tests/docs only if a parameter change survives verification.

**Steps:**

1. Run focused Grace tests.
2. Run `npm run verify` from the repository root if code changed.
3. Record before/after counts and percentages by stage, enemy, and policy.
4. State the balance-gate verdict: pass, fail, or calibration freeze.
5. State the expressiveness verdict: strong, thin, or broken.
6. If no tested Grace-owned lever improves the failed gate without breaking a healthy one, preserve shipped values and close with a calibration freeze.
7. Commit and push only after the Grace plan is executed and verified.

## Current verdict

**Calibration freeze, provisional.** Grace's full-roster early aggregate is already inside the 65–75% target, and the two obvious buffs worsened the healthy gate without materially moving midgame. The next legitimate Grace work is Task 2's policy/enemy decomposition and Task 3's card-economy audit—not another blind SWAY increase.

## Evidence ledger

- `ddec4adc`: live marker and explicit-capitulation truth surfaces aligned.
- Seeds 1 / 7 / 19, 100 runs per cell: early 74.5% / 74.2% / 74.4%; mid and late 0%.
- Rejected `soft-word` and `second-thoughts` perturbations are recorded above.
