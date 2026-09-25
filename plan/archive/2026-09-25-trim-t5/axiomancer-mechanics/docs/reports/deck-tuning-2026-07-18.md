# Deck-tuning run — 2026-07-18: swap-pool measurement pass (all 10 themes)

> **Status:** HISTORICAL — archived 2026-09-25 (trim T5, `plan/2026-09-25-trim-the-fat.spec.md` Tier 2 docs); superseded, kept for provenance. Original path: `axiomancer-mechanics/docs/reports/deck-tuning-2026-07-18.md`. Not a source of rules.

Working agent: card-expert (`/deck-tuning`), branch `claude/deck-tuning-37d3ff`.
Scope per owner instruction: every theme/preset gets real swap-variant
playtests of its Swap-Pool Atlas "trial FIRST" candidates. This run's primary
deliverable is MEASUREMENTS — no recipe or library literal was changed (see
"Applied changes"). All swap variants below are EVIDENCE devices; several
break the 5/5/5 color law or a cardType slot deliberately and may never ship
as-is.

## Method (reproduction)

- Control (one run, doubles as control cells for all ten themes):
  `npm run combat-playtest -- --stage=all --policy=all --deck=preset:all --runs=60 --seed=1 --cards --json`
- Treatment (per arm):
  `npm run combat-playtest -- --stage=all --policy=all --deck=preset:<p>+swap:<out>/<in> --runs=60 --seed=1 --sandbox=swap-<theme> --cards --json`
- IDENTICAL seeds/flags control vs treatment; 31 arms; 60 runs/cell; flag-off
  dice model (the sim default — no `--upgradeable-dice`).
- Reported cells: mid and late × blind and greedy (early shown where it is the
  discriminating stage), plus `mid/ALL8` = the mean across all 8 sim policies
  at mid. `sE` = statusEngagement, `dot` = dotHpFraction, `dom` =
  dominantCardShare. Seat telemetry aggregates each stage across all 8
  policies: plays/run and the card's share of total deck line contribution
  (free+paid).
- Doctrine target (starter curve, blind): early ~0.80 / mid ~0.50 /
  late 0.25–0.35.

## Baseline + drift finding

Regenerated the Step-2 matrix with the stored artifact's exact flags
(`--stage=all --policy=all --deck=policy-pick --runs=60 --seed=1 --cards`):
**all 144/144 cells drifted** against
`docs/reports/baselines/deck-matrix-baseline.json` (stamped commit
`0f7f0500`). The drift is EXPLAINED: the artifact predates PR #125
(`7f989382` "Press Fate rides every starter loadout — Gambler's Knot
default-worn, Venom Sigil benched" + enemy-library and sim-policy edits) and
PR #130. The swap-pool merge itself is sandbox-only data and moved nothing on
its own; the loadout/policy changes are the mover. Notable inherited shifts
(policy-pick matrix, not this run's doing):

- `turtle` and `mercy-seeker` collapsed at early (e.g. foot-stealer turtle
  0.75→0.07, mercy-seeker 1.00→0.37) — policy-roster edits in `6c39fd06`
  land differently under the new default loadout. Worth a look if those
  policies are meant to stay viable probes.
- `dot-weaver` at mid exploded upward (hasshaku-sama 0.00→0.73, jeweled-tree
  0.00→0.77) — Press Fate + dot drafting is a large interaction.

The baseline artifact was re-stamped at HEAD via `npm run baseline:regen`
(see Applied changes); future drift signals are live again.

### Per-preset spread at HEAD (control run, blind; min/median/max win rate across the stage's enemy roster)

| preset | early | mid | late |
|---|---|---|---|
| erosion | 0.40/1.00/1.00 | 0.00/0.38/0.95 | 0.00/0.00/0.17 |
| oratory | 0.52/1.00/1.00 | 0.07/1.00/1.00 | 0.00/0.02/0.62 |
| foundry | 0.00/0.83/0.98 | 0.00/0.00/0.00 | 0.00/0.00/0.00 |
| penitent | 0.33/0.95/1.00 | 0.00/0.15/0.55 | 0.00/0.00/0.00 |
| standstill | 0.02/0.96/1.00 | 0.00/0.00/0.00 | 0.00/0.00/0.00 |
| augury | 0.00/0.91/1.00 | 0.00/0.00/0.03 | 0.00/0.00/0.00 |
| tithe | 0.28/1.00/1.00 | 0.00/0.18/0.38 | 0.00/0.00/0.00 |
| grace | 0.00/1.00/1.00 | 0.00/0.00/0.00 | 0.00/0.00/0.00 |
| bastion | 0.13/1.00/1.00 | 0.00/0.03/0.22 | 0.00/0.00/0.00 |
| refrain | 0.35/1.00/1.00 | 0.05/0.42/0.87 | 0.02/0.03/0.18 |

Mid-floor breaches at HEAD: foundry, standstill, augury, grace at 0.00 median;
bastion 0.03. **The atlas telemetry note "penitent mid 0.92 dominance" does NOT
reproduce at HEAD** — penitent mid blind is 0.18 (median 0.15). The Press Fate
loadout change inverted penitent's problem from dominance to mid
UNDER-performance; the atlas's dilution program for akrasia is measured below
but is aimed at a breach that no longer exists.

---

## Evidence per theme

Cell format: `control → treatment (Δ)`.

### 1. affliction / erosion

**e1 · slippery-slope → poisoned-well (x4 body common, like-for-like color+rarity)**

| stage/policy | win | sE | dot |
|---|---|---|---|
| mid/blind | 0.370 → 0.503 (+0.133) | 0.298 → 0.302 | 0.482 → 0.480 |
| mid/greedy | 0.377 → 0.493 (+0.117) | 0.298 → 0.303 | 0.477 → 0.479 |
| late/blind | 0.028 → 0.050 (+0.022) | 0.290 → 0.294 | 0.401 → 0.389 |
| late/greedy | 0.028 → 0.039 (+0.011) | 0.291 → 0.293 | 0.395 → 0.390 |
| mid/ALL8 | 0.402 → 0.465 (+0.063) | 0.301 → 0.301 | — |

Seat: OUT slippery-slope 6.11 plays/run, share 0.350 (mid) → IN poisoned-well
6.04 plays/run, share 0.469, 0 fizzles. Early is band-flat (0.894→0.908).

**Verdict: PROMOTE-CANDIDATE.** The front-loaded i2d2 poison read beats the
i1d4 ramp at the same seat exactly where the atlas hypothesized: mid lands on
the ~0.50 doctrine target (0.370→0.503 blind) with no engagement cost and no
new dominance. Same aspect (body), same rarity — 5/5/5 arithmetic passes
as-is. Promotion caveats: (a) library insertion of a swap-pool card is
owner-gated (pool is ratified as NOT player-facing), and (b) slippery-slope is
erosion's D8 valve `replacesId` — a full eviction must re-seat
`PRESET_DICE_VALVES.erosion` (poisoned-well is body, so the valve-law
arithmetic holds) and re-ratify flag-on. Filed `[needs-user-call]`.

**e2 · festering-argument → chronic-condition (x2 mind uncommon; the deposit-matched PROLONG probe)**

| stage/policy | win | sE |
|---|---|---|
| mid/blind | 0.370 → 0.377 (+0.007) | 0.298 → 0.301 |
| mid/greedy | 0.377 → 0.387 (+0.010) | 0.298 → 0.302 |
| late/blind | 0.028 → 0.019 (−0.008) | 0.290 → 0.293 |
| late/greedy | 0.028 → 0.022 (−0.006) | 0.291 → 0.294 |
| mid/ALL8 | 0.402 → 0.419 (+0.017) | 0.301 → 0.315 (+0.014) |

Seat: 3.20 plays/run at mid (vs 3.27), share 0.017 (vs 0.016), 5 fizzles /
~2,070 plays. **Verdict: KEEP-INCUMBENT (single-variable result banked).**
The probe did its job: PROLONG is playable, near-fizzle-free, and priced
neutral — the deposit-matched swap is statistically flat on every axis. PROLONG
is exercised but not differentiating at this seat; the keyword-atlas PROLONG
row now carries this receipt.

**e3 · resonance-detonation → the-verdict-of-rot (rare seat, detonation pole A; heart→mind color break)**

mid/blind 0.370→0.443 (+0.073), mid/greedy 0.377→0.447 (+0.070), but
late/blind 0.028→0.006 (−0.022), late/greedy −0.019, sE −0.01 to −0.005, dot
down at every stage, mid/ALL8 −0.016. Seat share late 0.262→0.200.
**Verdict: KEEP-INCUMBENT.** The slow-pole detonation trades away exactly the
late-stage burst the finisher seat exists for, and bleeds engagement.

**e4 · resonance-detonation → all-wounds-at-once (rare seat, spam-HIGH pole)**

Strictly worse everywhere: early −0.028/−0.025, mid −0.007/−0.010, late
−0.014/−0.014, sE −0.011 to −0.018, dot −0.08 at mid. Spam measurement: seat
share 0.063/0.186/0.310 (early/mid/late), plays 1.55/run late — **spam-clean**
(well under the 0.70 dominance bar), just weaker than the incumbent.
**Verdict: KEEP-INCUMBENT; spam-HIGH flag not confirmed at this seat.**

### 2. peroration / oratory

**o1 · exordium → videtur-quod (x4 heart common, like-for-like)**

| stage/policy | win | sE |
|---|---|---|
| mid/blind | 0.640 → 0.677 (+0.037) | 0.216 → 0.246 (+0.030) |
| mid/greedy | 0.643 → 0.680 (+0.037) | 0.217 → 0.248 (+0.031) |
| late/blind | 0.119 → 0.169 (+0.050) | 0.199 → 0.234 (+0.035) |
| late/greedy | 0.117 → 0.161 (+0.044) | 0.201 → 0.234 (+0.032) |
| mid/ALL8 | 0.655 → 0.661 (+0.006) | 0.203 → 0.226 (+0.023) |

Seat: 7.16 plays/run mid (vs 7.59), share 0.470, 0 fizzles.
**Verdict: PROMOTE-CANDIDATE.** Small consistent win lift on blind/greedy plus
the run's cleanest engagement gain at a commons seat, zero re-partition
(heart common for heart common). Mid is already above band (0.64 blind) —
this pushes it up, not down; if oratory's mid dominance is the concern the
seat is a wash on that axis (dom 0.99 unchanged). `[needs-user-call]` for
library insertion (pool gating), same as all promotions this run.

**o2 · peroratio-interrupta → recapitulatio (x2 mind uncommon; spend-vs-hoard probe)**

mid −0.023/−0.027, sE −0.023/−0.025, mid/ALL8 −0.033. Seat telemetry is the
verdict: **384/669/819 fizzles** (early/mid/late, ~2,100 plays at mid), share
collapses 0.246→0.027 while plays RISE to 6.27/run — the policies keep
replaying a card whose REARGUE-style precondition is rarely met, and the deck
pays the tempo. The dot spike (0.16→0.55) is displacement: with the
interrupta payoff dead, wins route through venom-and-vein poison instead.
**Verdict: KEEP-INCUMBENT — dead-card-as-seated finding.** Recapitulatio's
spend-side design needs a deck that actually hoards; oratory as recipes'd is a
spender. CONCEDE centrality unchanged (concede counts flat vs control).

**o3 · the-closing-word → quod-erat-demonstrandum (rare heart seat; spam-HIGH dominance check)**

| stage/policy | win | sE |
|---|---|---|
| mid/blind | 0.640 → 0.727 (+0.087) | 0.216 → 0.227 |
| mid/greedy | 0.643 → 0.733 (+0.090) | 0.217 → 0.228 |
| late/blind | 0.119 → 0.278 (+0.158) | 0.199 → 0.212 |
| late/greedy | 0.117 → 0.292 (+0.175) | 0.201 → 0.212 |

Win-path decomposition (blind+greedy pooled): mid concede 68→149 of 438→438
wins; late concede 43→145 (concede becomes 71% of late wins). Seat spam
check: 2.14 plays/run mid, contribution share 0.006 — QED's power is all
CONCEDE-path, not line dominance. **Verdict: PROMOTE-CANDIDATE with a
concede-centrality caution.** It lifts late INTO the 0.25–0.35 doctrine band
(0.12→0.28/0.29) — the single biggest curve-repair measured this run — but it
makes CONCEDE the primary late win path. The atlas's instruction to hold
`confirmatio` back until QED calibrates concede-acceleration stands: QED
accelerates it hard. Owner taste call on whether a concede-dominant late game
is the intended oratory fantasy before promotion.

### 3. forge / foundry

Control context: foundry statusEngagement is 0.000 at every stage (the
enemy-side-only metric is fully blind to its buff engine) and mid/late are
0.000 flat.

**f1 · half-step → hammer-rhythm (x4 body common)**
early +0.114/+0.117 (0.60→0.71), mid 0.000 flat, sE 0→0.21, dot 0→0.85.
Seat: 5.78 plays/run mid, share 0.891, 113 fizzles.

**f2 · half-step → tempered-edge (x4 body common)**
early **+0.203/+0.203 (0.60→0.80 — lands ON the early band)**, mid
0.000→0.003/0.010, sE 0→0.21, dot 0→0.93. Seat: 5.96 plays/run mid, share
0.904, 122 fizzles.

**f3 · ex-nihilo → brand-of-the-maker (x2 mind uncommon, like-for-like)**
early +0.053/+0.056, mid ~0.003, sE 0→0.10, dot 0→0.86. Seat share 0.895,
0 fizzles.

**Verdicts: tempered-edge PROMOTE-CANDIDATE (first choice), hammer-rhythm
second choice, brand-of-the-maker NEEDS-MORE-DATA (positive but small).**
The atlas's "in-theme erosion floor" hypothesis is confirmed emphatically:
giving foundry ANY DoT line makes its enemy-facing engagement metric go from
0.00 to 0.21 and repairs early to band. Two structural findings ride along:
(a) the swap-in's contribution share is 0.89–0.96 — in a deck whose other 14
cards deal no enemy-facing HP, the single DoT card is definitionally the whole
kill line; that is a preset-shape finding (foundry needs its cash-out verbs,
not one imported chip line), not a card-dominance indictment. (b) mid/late
stay 0.00 regardless of seat — the foundry mid breach is engine/preset-level
(pip cash-out vs boss HP, the known plan-#2 item), unfixable by any single
common. Note: ash-litany (r2 common, mind) has NO rarity-legal seat — foundry's
mind cards are all uncommons/rares; recorded as an atlas seat-grid gap.

### 4. akrasia / penitent

Control context: the atlas's dominance premise (mid 0.92) is stale — HEAD
control is mid blind 0.180 / greedy 0.173, late 0.000. Penitent is now BELOW
band at mid, so the dilution levers were measured as planned but their
purpose has inverted.

**p1 · sweet-poison → beggars-bandage (x4 body common, dilution)**
Catastrophic: early −0.197, mid 0.180→0.000, sE −0.15 to −0.18, dom
0.99→0.59. Seat: 9.88 plays/run early with **552 fizzles** and 0.000
contribution share — a heal/defend line the policies spam into no value while
the deck's engine common is gone. **Verdict: KEEP-INCUMBENT (dead card as
x4 seat; dilution overshoots into deck-death).**

**p2 · against-my-judgment → count-the-cost (x4 heart common, like-for-like)**
mid +0.037/+0.047 (0.180→0.217 blind), early flat, sE −0.040 to −0.051, late
0.000 flat. **Verdict: NEEDS-MORE-DATA.** The only akrasia candidate that
helps the actual (mid-underperform) problem, but it pays for the win lift
with a real engagement drop — against doctrine. Not promotable on this
evidence alone.

**p3 · delphic-ambiguity → absolution-on-account (u seat, mind→heart color break)**
sE +0.043/+0.044 (best engagement gain in akrasia), dot +0.19, win −0.02 to
−0.03 mid. Seat share falls 0.257→0.047. **Verdict: NEEDS-MORE-DATA.**
Engagement-positive, win-negative; as a color-breaking evidence device it
cannot ship anyway. Suggests the deposit shape is right but the payout is
underpriced for the seat it displaces (delphic cashes the deck's own DoTs —
share 0.26 — and absolution does not replace that cash-out).

Spam-HIGH akrasia cards (the-usurers-due, how-much-is-enough,
the-last-relapse, every-mark-comes-due): NOT seated by any trialed swap this
run — unmeasured, flags stand.

### 5. control / standstill

Control context: mid and late 0.000 across ALL 8 policies; dominance at mid
0.95/0.86 (blind/greedy) concentrated on fallen-grace (share 0.665 at mid —
the akrasia borrow IS the deck's HP line).

**s1 · fallen-grace → quietism (heart u, same-color un-borrow)**
win flat everywhere (mid stays 0.000), sE −0.061, dot −0.05, dom 0.95→0.82.
Seat share 0.665→0.091, 60 fizzles. **Verdict: KEEP-INCUMBENT for now.**
The un-borrow retires the deck's only real HP contribution and quietism's
GUARD-side value is invisible to the enemy-side metrics; win rate says the
deck survives no better. Purity improves, nothing else does.

**s2 · cassandras-burden → the-cold-gallery (heart u, same-color un-borrow)**
early −0.036, mid/late flat at 0.000, sE −0.047 early. Seat: 3.39 plays/run
mid with **0.000 contribution share — a dead card as seated** (its payload
never converts under these policies). **Verdict: KEEP-INCUMBENT; dead-card
finding on the-cold-gallery.**

**s3 · turnabout → the-collected-toll (rare mind finisher A/B)**
win 0.000→0.003 mid (both effectively zero), sE flat, **dom 0.95→0.86 blind /
0.86→0.76 greedy** — the toll's steadier cash-out spreads impact without
changing outcomes. Seat share 0.020 vs 0.021, spam-clean (1.73 plays/run).
**Verdict: NEEDS-MORE-DATA.** The finisher A/B cannot discriminate while the
deck cannot win at mid at all; re-run after the standstill mid breach is
addressed at engine/preset level.

**s4 · red-herring → the-inward-blow (x4 mind common, like-for-like)**
early +0.047/+0.042, mid 0.000→0.013, but sE −0.074/−0.062 at every stage.
Spam check: 8.73 plays/run at mid (up from 6.89), share 0.087 — spam-elevated
but contribution-thin. **Verdict: KEEP-INCUMBENT.** Trades the theme's status
texture for chip tempo; against doctrine.

**Theme finding:** no seat-level swap moves standstill off 0.00 at mid. The
breach is structural (rung denial does not scale into boss HP), matching the
known plan-#1/BACKFIRE-ledger items — engine constants / preset-shape work,
flagged for handoff, not card numbers.

### 6. oracle / augury

**a1 · glimpse → read-the-entrails (x4 mind common, like-for-like)**
mid 0.007→0.050/0.053 (+0.043/+0.047), ALL8 mid +0.038, but sE −0.018 to
−0.027 and dot roughly halves (0.217→0.129 mid). Seat share 0.577 at mid.
**Verdict: NEEDS-MORE-DATA** — real win lift, engagement cost; the entrails
read displaces glimpse's poison seeding.

**a2 · the-oracles-eye → the-grand-prognostication (rare heart seat; ENCHANTMENT→SPELL type break)**
early +0.033, mid +0.017 (0.007→0.023), sE −0.010. Seat share 0.124 at mid
(the eye's is 0.000 — another zero-contribution enchantment under these
metrics). **Verdict: NEEDS-MORE-DATA;** cannot ship as-is (type-slot break —
the recipe's enchantment seat would empty).

**a3 · self-flagellant → half-spoken-prophecy (u seat, body→mind color break; RUPTURE swap)**
mid +0.037/+0.037, sE +0.008, dot +0.078 (0.217→0.295) — the only augury
candidate that is BOTH win- and engagement-positive. 344 fizzles at mid
(precondition-gated RUPTURE), seat share 0.167 vs incumbent 0.251.
**Verdict: best augury candidate; NEEDS-MORE-DATA + `[needs-user-call]`** —
it is a color-breaking swap (body→mind) so shipping requires a re-partition
or a recolor, a standing owner call. Augury's mid breach (0.007 control)
remains structural regardless of seat.

### 7. harvest / tithe

**t1 · brief-candle → tallow-and-wick (x4 body common churn line)**
early −0.028/−0.017, **mid 0.160→0.023/0.163→0.017 (−0.137/−0.147)**, sE
−0.107, dot halves (0.516→0.266). tallow plays MORE (12.40/run mid vs 11.16)
for less (share 0.503 vs 0.647). **Verdict: KEEP-INCUMBENT.** The atlas
hypothesis "statusEngagement should hold/rise on a churn swap" is refuted at
this seat: brief-candle's specific expiry economics ARE the tithe engine.

**t2 · disarming-smile → widows-portion (heart common defensive swap)**
early −0.072, mid 0.160→0.023 (−0.137/−0.140), sE −0.141. widows-portion
logged **~3,000 fizzles per stage** — its spared/defensive precondition
almost never holds as seated. The predicted enemy-only-metric under-read is
NOT the story; the win rate itself collapses. **Verdict: KEEP-INCUMBENT
(dead card as seated).** Note disarming-smile's own contribution share is
0.000 — it wins tempo, not lines — so the defensive-swap experiment should
next target a seat that is not also the deck's rapport softener.
Finisher-out rares (harvest-home, winter-count, bar-the-granary-door): not
trialed (hypothesis probes only, per atlas).

### 8. charm / grace

Control context: grace sE is 0.000 (SWAY is player-side; metric-blind), mid
0.000, early 0.689/0.717 blind/greedy — below band. Wins are CAPITULATE-only.

**g1 · crumbling-resolve → the-white-flag-woven (DISENCHANT→SPELL type break; purity dent removal)**
early **+0.106/+0.081 (0.689→0.794 blind)**, mid 0.000→0.033/0.027, dot
0.269→0.000 — the deck's last HP touch disappears (purity restored: control's
standing-wall drip was 26% of its damage profile). sE 0→0.038.
**Verdict: PROMOTE-CANDIDATE on the numbers, `[needs-user-call]` on the
slot** — it breaks the disenchant seat (recipe law) so shipping needs either
a recolor/retype or a ratified recipe-law exception. Evidence says grace wins
MORE by pure capitulation without the HP dent it was traded for.

**g2 · measured-answer → grace-under-fire (x4→x2 body uncommon, like-for-like)**
early **+0.122/+0.100 (0.689→0.811 — ON band)**, mid 0.000→0.043/0.047, sE
0→0.056, late flat 0. **Verdict: PROMOTE-CANDIDATE.** Same-color same-rarity
honesty swap, the strongest legal grace result; converts a borrowed bulwark
guard into in-theme survival that measurably wins.

**g3 · pair: second-thoughts→a-name-remembered + the-olive-branch→the-flaw-confessed (mark package; two-swap grammar)**

Seat note: the atlas's "into the second-thoughts seat" needs two outs under
the swap grammar; the-olive-branch (u, body) was chosen as the second seat to
keep soft-word's SWAY engine intact — the-flaw-confessed (c, mind) lands there
rarity- and color-broken (evidence device).

early −0.019/−0.044, mid/late 0.000 flat, **sE 0.000→0.185/0.173 — the
largest statusEngagement gain of the entire run**, dom 1.00→0.64. Win-path:
the pair opens an HP-victory line (24 early victories vs 0 in control) beside
459 capitulations — a purity dent, the exact opposite of g1's repair.
**Verdict: NEEDS-MORE-DATA + `[needs-user-call]`.** The mark package proves
charm can host real status texture (doctrine-positive), but it costs a little
win rate, dents purity, and needs a legal two-seat home. Re-trial after an
owner call on whether grace should carry an HP line at all — g1 and g3 are
opposite answers to the same question.

### 9. bulwark / bastion

**b1 · nettle-cloak → pebble-in-the-boot (x4 body common, like-for-like)**
mid 0.070→0.133 blind / 0.093→0.143 greedy (+0.063/+0.050 — roughly doubles
the atlas's "mid ~14%" problem number... in the right direction), early
+0.019, sE flat-positive, dot 0.695→0.931. Seat share 0.611 at mid, 0
fizzles. **Verdict: PROMOTE-CANDIDATE.** Cleanest legal seat in bulwark's
pool; still far below the 0.50 band — bastion's mid repair needs more than
one seat, but this is the right first seat.

**b2 · common-ground → written-in-scar (heart u, like-for-like; mark cash-out)**
early −0.039/−0.053, **mid 0.070→0.000 / 0.093→0.000**, sE flat, dom
1.00→0.66. Seat share 0.262 (incumbent 0.000). **Verdict: KEEP-INCUMBENT.**
The mark cash-out is real (it contributes lines and spreads dominance) but
removing common-ground's rapport softening loses more fights than the lines
win.

**b3 · the-adamant-wall → the-anvil-speaks (rare body spell seat, like-for-like)**
early +0.025/+0.028, mid +0.030/+0.030, sE +0.024, dot +0.04, late still 0.
**Verdict: PROMOTE-CANDIDATE (mild).** The "boss-loss answer" hypothesis is
directionally supported at mid, unproven at late (0.000 both arms).

### 10. echo / refrain

**r1 · self-flagellant → the-burden-of-repetition (u seat, body→heart color break; borrow retirement)**

| stage/policy | win | sE |
|---|---|---|
| mid/blind | 0.420 → 0.583 (+0.163) | 0.330 → 0.398 (+0.068) |
| mid/greedy | 0.443 → 0.600 (+0.157) | 0.332 → 0.398 (+0.066) |
| late/blind | 0.058 → 0.092 (+0.033) | 0.320 → 0.381 (+0.061) |
| late/greedy | 0.064 → 0.100 (+0.036) | 0.321 → 0.383 (+0.062) |
| mid/ALL8 | 0.509 → 0.608 (+0.100) | 0.338 → 0.384 (+0.046) |

**The strongest result of the run:** win AND engagement up at every measured
cell, and it retires an akrasia borrow (purity gain). Watch item: mid/late
dominantCardShare rises 0.79→0.90/0.96 — but the dominant card is
**winnowing** (the harvest borrow; 40/40 mid cells), not the swap-in: burden's
echo fuel feeds winnowing's REAP harder. Mid lands ABOVE the 0.50 band
(0.583/0.600 — refrain was already the healthiest preset). **Verdict:
PROMOTE-CANDIDATE + `[needs-user-call]`** — color-breaking (body→heart), so
shipping needs a re-partition; and the winnowing concentration deserves one
follow-up arm (burden + a winnowing downtune probe) before ratification.

**r2 · winnowing → the-second-telling (u seat, body→mind color break)**
mid −0.033/−0.047, ALL8 mid −0.127, late −0.017/−0.025. Confirms winnowing's
centrality from the other direction. **Verdict: KEEP-INCUMBENT.**

**r3 · opening-statement → the-point-lands (x4 heart common, like-for-like; early spam share measured FIRST per atlas)**
Early spam share: the-point-lands 3.41 plays/run, contribution share **0.028**
(incumbent opening-statement: 3.33/run, share 0.292) — no spam, the opposite:
near-zero contribution. And the deck collapses: mid −0.127/−0.150, sE −0.114
everywhere. **Verdict: KEEP-INCUMBENT; the x4-payoff-seat hypothesis is dead
at this seat** (the payoff never accumulates without opening-statement's
mark+poison seeding — it was feeding itself).

---

## Spam-watchlist measurements (this run's seated spam-HIGH cards)

| card | seat/arm | plays/run (peak stage) | contribution share | dominance breach (>0.70)? |
|---|---|---|---|---|
| all-wounds-at-once | e4, erosion rare | 1.55 (late) | 0.310 | no |
| quod-erat-demonstrandum | o3, oratory rare | 2.14 (mid) | 0.006 (concede-path power) | no — but concede becomes 71% of late wins |
| the-collected-toll | s3, standstill rare | 1.73 (mid) | 0.020 | no (near-dead instead) |
| the-inward-blow | s4, standstill x4 | 8.73 (mid) | 0.087 | no; play-count elevated (+27% vs seat) |
| the-burden-of-repetition | r1, refrain u | 2.44 (mid) | 0.189 | no — but winnowing rises to 0.90+ dom share behind it |

Unmeasured spam-HIGH flags stand: akrasia's four, control's
tortoises/stadium/shut-door/every-door/stalemate/proof-by-exhaustion cluster,
charm's the-patient-siege/the-crown-conceded, harvest finisher-outs.

## Per-deck line-telemetry appendix (swapped seats, mid stage, all-8-policy aggregate)

| arm | OUT plays/run · share | IN plays/run · share · fizzles |
|---|---|---|
| e1 | slippery-slope 6.11 · 0.350 | poisoned-well 6.04 · 0.469 · 0 |
| e2 | festering-argument 3.27 · 0.016 | chronic-condition 3.20 · 0.017 · 5 |
| e3 | resonance-detonation 1.66 · 0.150 | the-verdict-of-rot 1.64 · 0.123 · 0 |
| e4 | resonance-detonation 1.66 · 0.150 | all-wounds-at-once 1.60 · 0.186 · 0 |
| o1 | exordium 7.59 · 0.429 | videtur-quod 7.16 · 0.470 · 0 |
| o2 | peroratio-interrupta 4.19 · 0.246 | recapitulatio 6.27 · 0.027 · 669 |
| o3 | the-closing-word 2.08 · 0.005 | quod-erat-demonstrandum 2.14 · 0.006 · 0 |
| f1 | half-step 5.76 · 0.000 | hammer-rhythm 5.78 · 0.891 · 113 |
| f2 | half-step 5.76 · 0.000 | tempered-edge 5.96 · 0.904 · 122 |
| f3 | ex-nihilo 2.88 · 0.000 | brand-of-the-maker 2.79 · 0.895 · 0 |
| p1 | sweet-poison 6.42 · 0.579 | beggars-bandage 7.99 · 0.000 · 375 |
| p2 | against-my-judgment 5.67 · 0.040 | count-the-cost 5.82 · 0.042 · 122 |
| p3 | delphic-ambiguity 3.09 · 0.257 | absolution-on-account 3.55 · 0.047 · 55 |
| s1 | fallen-grace 3.33 · 0.665 | quietism 3.68 · 0.091 · 60 |
| s2 | cassandras-burden 3.29 · 0.195 | the-cold-gallery 3.39 · 0.000 · 0 |
| s3 | turnabout 1.73 · 0.021 | the-collected-toll 1.73 · 0.020 · 0 |
| s4 | red-herring 6.89 · 0.070 | the-inward-blow 8.73 · 0.087 · 0 |
| a1 | glimpse 5.80 · 0.513 | read-the-entrails 5.83 · 0.577 · 0 |
| a2 | the-oracles-eye 1.39 · 0.000 | the-grand-prognostication 1.59 · 0.124 · 0 |
| a3 | self-flagellant 2.99 · 0.251 | half-spoken-prophecy 3.04 · 0.167 · 344 |
| t1 | brief-candle 11.16 · 0.647 | tallow-and-wick 12.40 · 0.503 · 0 |
| t2 | disarming-smile 12.05 · 0.000 | widows-portion 7.36 · 0.111 · 3007 |
| g1 | crumbling-resolve 1.87 · 0.000 | the-white-flag-woven 3.71 · 0.000 · 0 |
| g2 | measured-answer 4.53 · 0.000 | grace-under-fire 6.44 · 0.000 · 0 |
| g3 | second-thoughts 8.54 · 0.000 | a-name-remembered 6.42 · 0.000 · 0 |
| b1 | nettle-cloak 7.50 · 0.589 | pebble-in-the-boot 7.52 · 0.611 · 0 |
| b2 | common-ground 3.81 · 0.000 | written-in-scar 2.71 · 0.262 · 0 |
| b3 | the-adamant-wall 1.94 · 0.000 | the-anvil-speaks 1.94 · 0.125 · 0 |
| r1 | self-flagellant 2.45 · 0.099 | the-burden-of-repetition 2.44 · 0.189 · 0 |
| r2 | winnowing 2.42 · 0.080 | the-second-telling 2.68 · 0.275 · 0 |
| r3 | opening-statement 5.22 · 0.227 | the-point-lands 4.94 · 0.030 · 0 |

Zero-share incumbents/candidates are guard/rapport/SWAY/buff lines the
enemy-facing contribution metric cannot see (the known statusEngagement
blind-spot family) — their value shows only in win-rate deltas.

## Applied changes

1. `docs/reports/baselines/deck-matrix-baseline.json` — re-stamped at HEAD via
   `npm run baseline:regen` (the stored artifact predated the PR #125 loadout
   change; 144/144 cells had drifted). Measurement artifact only.
2. `docs/keyword-atlas.md` — PROLONG row: chronic-condition probe receipt
   (exercised clean, priced neutral, single-variable A/B this report);
   REARGUE row: noted still-unmeasured (reopen-the-question was not a
   trial-first pick; recapitulatio's fizzle-death is adjacent evidence that
   spend-preconditioned mind uncommons die in spender decks).
3. This report.

No recipe, library, sandbox, or engine literal was touched. Considered but
not applied: promoting poisoned-well / videtur-quod / grace-under-fire /
pebble-in-the-boot into their recipes — blocked by the swap-pool
player-facing gate (owner ratification 2026-07-18: pool cards are
/deck-tuning devices, NOT a player-facing mid-library), and for poisoned-well
additionally by the D8 valve-seat re-ratification. All filed below.

## [needs-user-call] queue

1. **Pool-card promotion gate (blocks every promote-candidate above):** the
   swap pool is ratified as not-player-facing. Ratify (or refuse) a promotion
   path: library insertion + recipe seat for, in evidence order:
   the-burden-of-repetition (refrain; also needs body→heart re-partition),
   poisoned-well (erosion; also needs `PRESET_DICE_VALVES.erosion.replacesId`
   re-seat + flag-on A/B), grace-under-fire (grace), tempered-edge (foundry),
   quod-erat-demonstrandum (oratory; see #2), videtur-quod (oratory),
   pebble-in-the-boot (bastion), the-anvil-speaks (bastion).
2. **Concede centrality (oratory):** QED lifts late into band but makes
   CONCEDE 71% of late wins. Is a concede-dominant late oratory the intended
   fantasy?
3. **Grace HP-purity direction:** g1 (remove the last HP drip; wins more) and
   g3 (add a mark/DoT line; biggest engagement gain of the run) are opposite
   answers. Pick a direction before either ships.
4. **Color-law re-partitions:** half-spoken-prophecy (augury) and
   the-burden-of-repetition (refrain) only ship with a recolor or
   re-partition — standing owner call per the color-law fallout note.
5. **Policy-roster health (inherited):** turtle/mercy-seeker collapsed at
   early under the new default loadout (baseline drift table). Intended?

## Open questions / follow-ups

- Standstill, foundry, augury, grace mid ~0.00 are structural (engine
  constants / preset shape), not seat-level — handoff to manual engine tuning
  per doctrine; do not compensate with card numbers.
- r1 follow-up arm before any ratification: burden-of-repetition + winnowing
  downtune probe (winnowing dom share 0.90+ behind it).
- Recapitulatio, beggars-bandage, widows-portion, the-cold-gallery are
  dead-as-seated: pool-side redesign candidates (precondition too narrow for
  the seats they can legally take).
- Penitent atlas telemetry (mid 0.92 dominance) is stale at HEAD (mid 0.18);
  the akrasia pool's dilution levers need a new objective.
- Ash-litany has no rarity-legal foundry seat (mind commons don't exist in
  that recipe) — atlas seat-grid gap.

## Run ledger

31 treatment arms + 1 control (`preset:all`) + 1 policy-pick drift regen;
60 runs/cell, seed 1, flag-off dice; raw JSONs in the session scratchpad
(`runs/*.json`), analyzer `analyze.mjs` (control-vs-treatment aggregation),
`paths.mjs` (win-path decomposition), `spread.mjs` (per-preset spread).
