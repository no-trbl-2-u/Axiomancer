# The honest re-baseline + evidence report (Phase 27 deliverable, re-cut at the reconciled tree)

**Date:** 2026-07-11/12 · **Commit measured:** `e203fed9a21bc91ec62f21347b567ef62ead6b71`
(HEAD = Turn Law `6ea123fc` + the cloud-phase reconciliation merge, which lands
the **Phase 28 Overtake 2-pip gate** — a real Foundry-relevant engine change).

**Supersedes:** the stale `6ea123fc`/`70c64501` scratch cut, the pre-Turn-Law
`f196d219` provisional baseline, and — for numbers — the cloud loop's
`plan/tuning/2026-07-11-phase27-rebaseline.md` (measured a different, pre-merge
tree). Every figure below is a **first Turn-Law-honest measurement at the
reconciled tree**.

**Harness:** `npm run combat-playtest -- --stage=all --policy=all --runs=60
--seed={1,2,3} --cards [--json] [--sandbox=<setId>]` — 144 cells/seed (4 stages
× 6 enemies × 8 policies × 60 runs, policy-pick decks), plus preset probes,
the WS7.1 cap sweep, and `runRewardDraftSim` (N=200 screens × 10 origins × 3
seeds). Receipts: `axiomancer-mechanics/docs/reports/rebaseline-scratch/`
(kept deliberately — every table below has a raw file behind it;
`rederivations.md` in that directory is the §1 derivation log). The checked-in
`docs/reports/baselines/deck-matrix-baseline.json` was regenerated from the
seed-1 `--json` output and meta-stamped at `e203fed9`.

**Accounting caveat (applies to every damage-mix fraction):** Phase 26 also
landed the DoT-overkill attribution clamp, so pre-law vs post-law damage
fractions differ partly by accounting fix, not only by the Turn Law.

---

## §1 The Turn-Law baseline

### 1.1 Stage curve vs the locked 80/50/25-35/0 doctrine (blind policy-pick)

| stage | doctrine | seed 1 | seed 2 | seed 3 | verdict |
|---|---|---|---|---|---|
| early | ~80% | 92.8% | 87.5% | 82.2% | slightly hot, in the neighborhood |
| mid | ~50% | 5.3% | 3.0% | 28.0% | **badly under**, high variance |
| late | 25–35% | 0.0% | 0.0% | 0.0% | **total collapse** |
| impossible | 0% | 0.0% | 0.0% | 0.0% | on target |

All-policy (runs-weighted): 85.1/10.5/0.1/0.0 (s1), 68.8/8.2/0.0/0.0 (s2),
66.4/13.0/0.0/0.0 (s3). Win paths per 8,640 runs: victories 2,676/2,105/1,956;
CAPITULATE 30/73/268; **mercy 0 in 25,920 runs**; concede 0.

**Farm-era inversion #1:** the pre-law blind reading was 99/94/2/12. Mid was
never ~94% — it was farm-propped. The honest curve fails **LOW** from mid
onward, the opposite direction from the farmed reading. The doctrine violation
is real but it points at under-power past early, not over-power.

### 1.2 Preset floors/ceiling (balance-bands vitest, 14/14 pass)

Calibration: early floor 0.20 (ratchet 0.40) · mid floor 0.00 (ratchet 0.25) ·
ceiling 1.00 (target 0.98). `[preset-spread]` early/mid/late:

erosion 1.00/0.38/0.00 · oratory 0.97/0.05/0.00 · foundry 0.90/0.00/0.00 ·
penitent 0.97/0.13/0.00 · standstill 1.00/0.07/0.00 · augury 1.00/0.03/0.00 ·
tithe 0.97/0.20/0.00 · grace 1.00/0.00/0.00 · bastion 1.00/0.00/0.00 ·
refrain 1.00/0.05/0.00.

- Early floor/ratchet: **PASS everywhere** (min 0.90 foundry vs 0.40 ratchet).
- Early ceiling: **6/10 presets at literal 1.00** (>0.98 target) — early is too safe.
- Mid ratchet 0.25: **only erosion (0.38) clears**; tithe grazes 0.20;
  foundry/grace/bastion at literal 0.00. Foundry fell 0.02→0.00 under the
  Overtake gate — the gate taxes exactly the deck built around the card.
- Late: **all ten at 0.00** — consistent with §1.1.
- `[curve]`: all ten presets decay monotonically (move −0.90 to −1.00, all OK)
  — the *shape* is right; the *level* from mid onward is not.

### 1.3 statusEngagement by stage — the collapse survived the law

Pre-law (farmed, blind): 66 → 34 → 22 → 16%.
Honest (blind, seed range): **31.8–35.8 → 20.2–20.9 → 10.4–13.1 → 11.0–15.7%**
(all-policy runs ~2–4pp lower).

**Farm-era inversion #2:** the early number was ~2× farm-inflated (66→~34);
mid/late lost proportionally less. The declining arc is intact and status play
never exceeds ~36% of card plays at any stage. Against the load-bearing
doctrine ("status effects are the MAIN fun"), this remains **the loudest
doctrine failure**, now with honest magnitudes.

### 1.4 Signature damage share and dead-card rate

Signature share (strikeFraction proxy — with card strikes schema-dead this is
signature-skill damage), all policies, by stage:
seed 1 = 43.8/47.8/46.6/46.4% · seed 2 = 40.1/41.8/41.4/41.1% ·
seed 3 = 30.9/50.9/35.4/33.1%.

**Farm-era inversion #3:** the pre-law matrix said 4–16% while farmed
transcripts screamed 90–95%. The honest number is in between and big:
**signatures deliver ~31–51% of ALL enemy HP loss at every stage.** The Gate-0
repricing question stays live; the monoculture panic does not.

Dead-card rate (70-card library): blind+greedy **68.6/78.6/75.7%**
(48/55/53 cards never played; pre-law 69%) — unchanged to slightly worse; the
Turn Law shortens fights and did not free circulation. All-8-policies:
24.3/34.3/34.3%.

### 1.5 WS1 line-telemetry offender re-cut

Rule: common/uncommon, FREE or PAID line share >0.85 or <0.15, ≥20 plays/seed,
flagged in all three seeds. **The official Turn-Law-honest library offender
list is EMPTY (0 offenders).**

**Farm-era inversion #4:** all 8 pre-law offenders (cassandras-burden,
common-ground, disarming-smile, glimpse, half-step, refrain,
sketch-of-a-thought, slippery-slope) now read mid-band (freeShare 0.35–0.73)
with the library lines unchanged — the "dead FREE line" reading was a
farm-loop artifact. Single-seed transients (watch only, never repeated):
s1 currys-conversion 0.85, winnowing 0.87; s2 arrow-paradox 0.99,
brief-candle 0.98, nettle-cloak 0.89; s3 against-my-judgment 0.90,
delphic-ambiguity 0.87. Seed-to-seed swing says deck composition drives line
choice more than card text — a standing caveat for single-seed cuts.

### 1.6 dominantCardShare violations (>0.70)

5/15/28 cells (seeds 1/2/3, of 144). Nearly all sit in degenerate-policy cells
(turtle/aggro-brute/control-lock/mercy-seeker), mostly losing (wr 0.00–0.37) —
a stalling policy replaying its one legal card. **Tuned witnesses
(blind/greedy) never breach.** Multi-seed library watch: **cassandras-burden**
(seeds 1–2, up to 0.92) and **straw-mans-jab** (seeds 2–3, literal 1.00 in
every seed-3 early control-lock cell). Seed-3-only: slippery-slope,
sig-disarming-plea.

### 1.7 Overtake 2-pip gate drift (measured vs the stale 6ea123fc cut)

`the-overtake` sits in policy-pick decks only at seed 1 (10 cells, 1,794
plays) plus the foundry preset. Seeds 2/3 are **bit-identical** to the stale
cut; seed 1 moved slightly (victories 2,671→2,676; mid signature share
46.5→47.8%); foundry preset early 0.88→0.90, mid 0.02→0.00. The gate's
footprint is small and confined to where the card actually sits — but it did
zero out foundry's mid ratchet reading.

---

## §2 Per-workstream gate judgments

Killed cards are **findings, not failures** — the sandbox did its job.

### Cross-cutting harness findings (read before the verdicts)

1. **The pool-shuffle artifact.** At seed 2, the mid-stage A/B delta is
   **+10.8pp (8.2→19.0%, V/C/D 148/49/2203 → 449/8/1943) IDENTICALLY** in the
   conjure-exercise, roles-bulwark, and roles-harvest runs — three different
   sandbox sets, one identical matrix. Adding *any* 71st/72nd eligible card
   reshuffles the policy-pick draft lottery the same way at a given seed.
   Matrix-level stage deltas in these A/Bs are **not attributable to the
   sandbox cards**; only per-card telemetry and dominance are.
2. **Draft visibility is the systemic failure, not card design.** Five sets
   (doom-species, chooseX-vein, roles-charm, roles-harvest, roles-forge's
   ingot) had **zero drafts at one or more seeds**; the policy-pick scorer
   never surfaces them. The direct-draft probe (`probe-ingot-draftability.ts`)
   shows ingot-of-ruin is structurally draftable (top pick-share in utility
   late drafts, 189/1200 across focuses) — the matrix scorer and the draft
   lottery disagree. A draft-weight/offer-rate fix is the common follow-up.
3. **Preset probes cannot witness sandbox cards.** The bastion late preset A/B
   is bit-identical to control (preset decks are fixed lists; sandbox cards
   land only in drafted decks) — WS4 gates phrased as "preset X gains a line"
   are unwitnessable under the current harness without preset-injection
   support.

### WS2.1 — CONJURE exercise (foundry-sprite + corollary): **PASS** (all 3 clauses)

- *Played when offered (Corollary early+mid, Sprite mid+late):* PASS — every
  window slot witnessed in ≥1 seed (Corollary early 36/48 cells s1, 4,375
  plays; Sprite late 12/48 s1, mid 10/40 s2); unplayed-at-phase-end **0%**
  everywhere either card was in deck.
- *Conjured Thoughtforms actually played:* PASS — tf-cinder 411/411 and
  304/304 bottom-line conversions (100%), tf-minor-premise 92%/98%; token
  fizzle 0–2%. The CONJURE atlas row earns its first +.
- *Neither dead nor >0.70 dominant:* PASS — neither card (nor token) is
  dominantCardId in any of 288 cells. Corollary alive in wins (1,812/2,566 s1).
  **Flag:** Sprite's win witness is 1 victory across two seeds (draft weights
  put it only in late/impossible decks, where nothing wins); Corollary's
  secondary "share of wins containing it" hit 70.6% at s1 (early-presence
  artifact, 8.9% at s2 — not a kill). Stage deltas: pool-shuffle noise
  (opposite mid signs across seeds).

### WS2.2 — FREE-line conversions (8 cards): **PASS** (all 3 clauses), premise stale

- *Each converted FREE share in 15–85:* PASS — all 16 readings in-band (44–66%).
  **Honest caveat:** the "vs <15 pre-conversion" contrast no longer exists —
  the un-sandboxed baseline already reads these lines 43–67% (§1.5). The
  clause passes but the conversion is not what moved them in-band.
- *No card >70% of wins:* PASS — worst is refrain at 62.0% of s1 wins
  (8.2% at s2 — composition noise). cassandras-burden's >0.70 cells pre-exist
  in baseline and the sandbox slightly improves them (mid dom 80→75% s1).
- *Preset floors hold:* PASS — greedy control→sandbox: erosion early 89→94%
  mid 20→37%; grace 79→87% / 3→16%; foundry 59→59% / 0→0%; augury and refrain
  flat. Marginal effect is small-positive: early CAPITULATE 27→166 (s1) /
  24→67 (s2), early statusEng +3.1/+3.4pp.
- **No card killed.** All 8 heavily played (2,949–24,233/seed) and present in
  winning cells.

### WS3 — DoT species data sweep, gate "Erosion + Tithe late >0 (target ≥15%), early in-band, no >0.70 dominance": **FAIL on the late target; kill condition NOT triggered**

Erosion late **0.00**, tithe late **0.00** at every seed (§1.2) — the ≥15%
late target is missed by the full distance. But so are all ten presets: the
miss is the **global late collapse**, not the clock assignment. The kill
condition (early-band violation the repricing can't pull back) did **not**
fire — early floors hold everywhere and no tuned-witness dominance breach
exists. Verdict: substrate and data stay; the late target transfers to the
stage-curve fix (mid/late power), not to a clock revert. Erosion's mid 0.38
(only ratchet-clearing preset) is weak positive evidence the payoff clocks do
lift the DoT theme where fights last.

### WS3.4 — Doom species (debt-of-days, doom-species set): **INCONCLUSIVE** (not killed, not promoted)

- *Drafted into wins:* seed 1 yes — 7 winning cells, 1,474 plays inside wins,
  mid +4.5pp, dot-weaver +9.4pp (V 380→478). Seeds 2 and 3: **0 drafts** —
  the pass is unconfirmed; kill condition ("never drafted into wins")
  disproven by seed 1.
- *<0.70 dominant:* PASS — 0/144 cells at every seed; max per-cell HP-swing
  share 16.1%.
- *DOOM ticks visible:* PASS (s1; vacuous s2/s3) — 1,363 creeping_doom lands,
  free tickOne 26,984 HP + paid DoT 77,066 HP projected, fizzle 0.0%.
- Follow-up: draft-weight/offer-rate fix, then re-confirm at two fresh seeds.

### WS4.1 — Forge (slag-runoff + ingot-of-ruin): slag **alive/PASS-leaning**, ingot **KILLED as written** (draft-visibility caveat); theme gate **INCONCLUSIVE**

- *slag-runoff:* drafted 60/144 cells s1 (8,789 plays, 1,787 wins in drafted
  cells), 12/144 s2/s3 (early only); 0 unplayed, fizz ≤1.3%, **no dominance
  cell at any seed**. Not dead, not dominant. Caveat: hpF/hpP ≈ 0 at s2/s3 —
  the KINDLE overflow's HP footprint is only witnessed at s1.
- *ingot-of-ruin:* drafted **0/432 matrix cells across all three seeds** —
  literally "never drafted into wins" = **DEAD by the matrix witness**. The
  structural probe contradicts the scorer (it is the top utility-focus late
  pick in direct drafts), so the recommended follow-up is the draft-weight fix
  + one re-cut **before deletion**; but as written, the card is killed.
- *"Foundry stops winning through utility verbs alone":* unwitnessable —
  no foundry-preset A/B ran and preset decks can't see sandbox cards (cross-
  cutting finding 3). Balance-band floors hold (identical early bands, s2/s3
  early deltas are pool-shuffle).

### WS4.2 — Bulwark (grit-between-stones + the-unmoved-mover): **FAIL on the gate, early band PASS**

- *Early band:* untouched — early identical to baseline both seeds (85.1/68.8%).
- *grit-between-stones:* plays 2,520/1,731, statusLands ~45%, hpPaid 40.6k/16.2k
  — the mechanism works — but **wins in drafted cells: 0 (s1) / 1 (s2)** and it
  is the dominant card >0.70 in **7 cells (s1, late turtle + impossible, max
  0.82) + 1 (s2)** — all losing turtle cells, the baseline cassandras pattern
  (stall-replay, not carry).
- *the-unmoved-mover:* s1 10 cells / 2,380 plays / 1 win; s2 **0 drafts**. The
  first combat-ledger condition card runs (rider fires, hpPaid 1,163) but its
  win relevance is a single run.
- *"Bastion gains a non-reactive kill path":* NOT witnessed — bastion late
  preset A/B bit-identical (0% → 0%), and in the matrix the pair contributed
  1 win across two seeds. Not killed (grit escapes "never drafted into wins"
  by one run; dominance breaches are degenerate-losing cells), but the gate
  fails at this tree.

### WS4.3 — Charm (a-sweeter-poison): **PASS-leaning INCONCLUSIVE**

Seed 1: drafted 12/144 (mid 5 / late 6 / imp 1), 2,191 plays (47% on the paid
mark-closer line), 0 fizz, 0 unplayed, hpP 13,755, **102 wins in drafted
cells** (all mid), no dominance cell. Late band not breached (late 0→0). Seed
2: **0 drafts** — same draft-visibility disease as doom/vein. Mechanism and
manners clean; presence unconfirmed. One more seed after the draft-weight fix.

### WS4.4 — Harvest (the-long-ledger + seedcorn-sacrifice): **FAIL on presence** + one real mechanism finding

- *Early band:* untouched at all three seeds (identical early rows).
- *the-long-ledger:* s1 24 cells / 4,152 plays but **fizzles 961 (23.1%)**;
  s2 5 cells / 805 plays / 26% fizz; s3 0 drafts. Wins in drafted cells: 2/1/0.
  **Finding:** the payoff-clock double-fire (consume_affliction ×2) fizzles a
  quarter of plays — it fires with nothing banked. The card needs a bank
  precondition or the clock needs a no-op guard before any promotion talk.
- *seedcorn-sacrifice:* s1 12 cells / 2,483 plays / 10% fizz / **71 wins in
  drafted cells including 5 impossible-stage victories** (the only sandbox
  card to buy wins at impossible); s2/s3 **0 drafts**. No dominance anywhere.
- *"Tithe gains mid/late presence":* not witnessed (draft visibility; tithe
  preset unprobed). Neither card killed — both were drafted into wins at s1.

### WS5.3 — sequencing grammar test: **PASS** (24/24 at HEAD, incl. the argmax-order kill-condition test)

### WS5.4 — microset draft appeal (gate ≥2 distinct origins ≥2.5%, twins once): **4/6 PASS**

Floor recalibrated 5%→2.5% with published justification (at 3 of 10 origins
**zero** of 70 library cards reach 5%; the raw floor kills everything and
discriminates nothing). Twin-origin collapse honored (erosion≡penitent,
augury≡refrain — byte-identical runs, 8 distinct witnesses).

- **PASS:** captatio-benevolentiae (foundry 3.7% + bastion 4.5%),
  in-medias-res (tithe 5.0% + augury/refrain 2.7%), coda (standstill 4.5% +
  tithe 3.7%), dying-echo (tithe 5.8% + erosion/penitent 4.5%).
- **FAIL (single class):** wages-of-weakness (only the erosion≡penitent twin
  at 4.5%/96% conv — one distinct witness), answered-in-kind (only
  erosion/penitent 3.7%). Both are the two **after-cost** condition cards —
  the family only appeals to the class already paying blood.
- Matrix cross-check (sequencing set A/B): no microset card ever >0.70
  dominant in a winning cell; coda fizzles 22.7–29.3% (same payoff-clock
  guard issue as the-long-ledger); wages-of-weakness playedInWinningCells NO
  at s1 (yes at s2 — not a kill, but consistent with its FAIL).

### WS6.3 — bridge rewards (gate: BOTH parents ≥2.5% mean pick): **1 PASS / 4 KILLED / 1 marginal FAIL**

- **PASS: the-poured-rampart** — foundry 6.0% / bastion 4.3%, all seeds at or
  above floor, conv 57%/62%, non-parents ≤1%. The only clean bridge — and this
  is Foundry picking it 6% *after* the Overtake 2-pip gate. Promotion candidate.
- **KILLED: barbed-compliment** — erosion converts **0/26 offers** across all
  seeds; single-parent (an 8th charm card). Splash at standstill/tithe argues
  re-home, not bridge.
- **KILLED: interest-on-the-flesh** — penitent 1.5% (below floor and below
  three non-parents); standstill/grace convert 86%/85%: the body is mis-homed.
- **KILLED (by gate, confounded): entered-into-evidence** — augury passes
  2.7%; oratory 1.7% but converts 50% while offer-starved (shown on 3.3% of
  screens — pick ceiling below the floor). Strongest retest candidate under a
  conversion-based gate.
- **KILLED: unbroken-countenance** — zero parents at floor; grace 22% conv;
  bastion 85% conv but rarity-starved to 2.2% offer rate; its condition rider
  is invisible to the verb-class-only pick policy (harness caveat on record).
- **FAIL (marginal): stolen-cadence** — standstill 4.8% @ **97% conversion**;
  refrain misses the floor by ≤1 pick/200 in 2 of 3 seeds. One more seed batch
  before the axe.
- Dominance: none — no bridge is a universal auto-pick.

### WS7.1 — RUPTURE cap-fraction sweep (F ∈ {0.25, 0.35, 0.45, 0.60}): **WINNER F=0.60**, applied

Monotone dominance: matrix early flat 85.1% at every F (the cap does not bind
policy-pick early); Foundry preset lifts monotonically where the cap binds
(early 57.8→64.8%, mid 0.0→1.4%); Tithe invariant (86.0/9.6/0.0); the >0.70
dominance set is **exactly F-invariant** (same 3 cells); the-overtake's
attributed HP grows +18% (30.4k→36.0k) without ever becoming dominant. Seed-2
confirm: winner matrix identical to baseline-seed2; Foundry early 64.8%
reproduced. Spec thesis holds (0.60 × ~100 HP ≈ 60 < the retired 80-HP floor
— a mild honest early nerf). `RUPTURE_CAP_FRACTION` set 0.35→0.60 in
`axiomancer-mechanics/src/Combat/effects.ts` with the sweep recorded in the
calibration comment.

### WS7.2 — chooseX (the-open-vein, chooseX-vein set): mechanism **PASS**, card **FAIL**

- *Card sees play:* **FAIL** — drafted 10/432 cells over three seeds (s2/s3:
  zero), only by turtle/mercy-seeker, in a winning deck exactly once (1/600
  vein-deck runs). Escapes the kill letter by that single run — one run from
  dead; the defect is draft appeal, not the mechanic.
- *Chosen-X non-degenerate:* **PASS at mechanism level** — probe modal X:
  greedy/blind 30, turtle 3, chaos 18 (all differ); hermetic e2e 5/5 green.
  Honest caveat: realized in-matrix X is 100% X=3 because only min-X policies
  ever drafted it — the picker works; the card never reaches the policies
  that would exercise it.

### WS9 — threat branches, in-band check: **PASS**

Branch substrate is live in the measured tree (`threat-branches.engine.test.ts`
green in the verify trio) and the balance-bands run over that tree is 14/14
with all floors/monotonicity holding (§1.2) — the branch prototype did not
move the bands. Full behavioral evidence (WS9.3 determinism + the two
prototype enemies) rides Phase 33, not this report.

---

## §3 Promotion queue

**Nothing is promoted in this report.** Each promotion is a follow-up
`/deck-tuning` PR (bump the 70/50 pins, one theme-pass per PR) per the session
map. The evidence sorts the sandbox as follows:

**Supported for promotion now:**
1. **the-poured-rampart** (WS6.3) — the one clean bridge; both parents at
   floor with strong conversion, post-Overtake-gate.
2. **corollary** (WS2.1) — all clauses pass, token conversion 92–98%, alive in
   wins at both seeds.
3. **WS2.2's 8 FREE-line conversions** — floors hold, small-positive marginal
   effect (CAPITULATE up, statusEng up, erosion/grace mid improve), no kill;
   promote as the Phase 30 down-payment they are (they must satisfy the
   Phase 30 FREE-currency lint when it lands).
4. **captatio-benevolentiae, in-medias-res, dying-echo** (WS5.4 passers with
   clean matrix manners).

**Supported with a named flag (promote or hold at the session owner's call):**
5. **foundry-sprite** (WS2.1) — gates pass but the win witness is 1 victory
   across two seeds; if promoted, pair with a draft-weight touch so it can
   appear where wins live.
6. **coda** (WS5.4 passer) — but fix the payoff-clock no-op guard first
   (22–29% fizzle).
7. **slag-runoff** (WS4.1) — alive, clean, never dominant; but its overflow HP
   footprint is single-seed and the forge-theme gate is unwitnessed.

**Need another pass (draft-weight/offer-rate fix, then 2 fresh confirm seeds):**
debt-of-days (WS3.4) · a-sweeter-poison (WS4.3) · the-open-vein (WS7.2) ·
seedcorn-sacrifice (WS4.4) · grit-between-stones + the-unmoved-mover (WS4.2,
also needs a preset-injection harness to witness its actual gate) ·
stolen-cadence (WS6.3, one more seed batch) · the-long-ledger (WS4.4, fizzle
guard first).

**Killed (findings, not failures):** ingot-of-ruin (0/432 matrix drafts; probe
says fix the scorer before deleting the card) · barbed-compliment ·
interest-on-the-flesh · entered-into-evidence (retest if the gate moves to
conversion) · unbroken-countenance. WS5.4 single-class failures
(wages-of-weakness, answered-in-kind) are draft-appeal fails, not kills —
their sequencing-test results stand.

**Engine constant already applied (manual-tuning lane, not a promotion):**
`RUPTURE_CAP_FRACTION` 0.35→0.60 (WS7.1 winner, in `effects.ts`).

**Systemic follow-up feeding all of the above:** the policy-pick draft scorer
starves new cards (cross-cutting finding 2). One targeted fix + re-cut
unblocks six pending verdicts at once — it is the highest-leverage single
change this evidence points at.

---

## §4 Asterisk lift

Phase 27's condition is met: the full matrix has been re-derived under the
Turn Law at the reconciled tree. Accordingly:

- **Every pre-2026-07-11 number in `plan/tuning/` remains asterisked** —
  farm-era measurements are historical context only and may not ground any
  balance decision (the §1 inversions show they mislead in *direction*, not
  just magnitude).
- **This document supersedes the WS1.5 provisional offender list** (the
  detailed plan's 8-card list): the Turn-Law-honest library offender list is
  **empty** (§1.5).
- The cloud cut `plan/tuning/2026-07-11-phase27-rebaseline.md` measured a
  pre-merge tree; where numbers disagree, **this report and the
  `e203fed9`-stamped `deck-matrix-baseline.json` are canonical**.
- Standing discipline holds: no gate is judged on pre-Phase-26 numbers, and
  every future cut states its commit hash the way this one does.

**Receipts:** `axiomancer-mechanics/docs/reports/rebaseline-scratch/`
(baselines seeds 1–3 txt+json, balance-bands output, all ten A/B matrices,
sweep outputs at four F values + seed-2 confirm, reward-draft raw counts +
tabulator, analysis scripts, `rederivations.md`).
