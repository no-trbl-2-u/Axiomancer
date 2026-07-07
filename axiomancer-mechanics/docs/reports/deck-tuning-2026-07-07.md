# Card Forge — deck-tuning report, 2026-07-07

**Scope:** full sweep (all stages, all policies). **Base:** `main` @ merge of PR #34.
**Applied change:** 1 card promoted (`corrosive-regress`). **Propose-only:** 2.

Doctrine north star (`CLAUDE.md` / `VISION.md`): status effects are the MAIN
fun; HP is the sole win condition and status is the EFFICIENT way to drop it.
Every finding below is judged by whether it keeps status play the efficient
path at every stage.

---

## 0. Cold gate (pre-change)

All deck suites pass cold before any edit:

```
npx vitest run combat-deck-draft.engine cards-sandbox.engine \
  combat-playtest.balance-bands.sim combat-playtest.card-coverage.sim
→ 4 files, 88 tests passed
```

## 1. Baseline matrix

`npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1`

| Stage | cells | win | statusEng | dotFrac | rounds | band | verdict |
|---|---|---|---|---|---|---|---|
| early | 48 | 92% | 35% | 47% | 6.5 | 0.55–1.0 | in-band |
| mid | 40 | 39% | 60% | 41% | 5.7 | 0.35–1.0 | in-band |
| late | 48 | 73% | 47% | 58% | 8.1 | 0.15–1.0 | in-band |
| impossible | 8 | 81% | 47% | 61% | 11.6 | see §4 | see §4 |

- Doctrine witness holds: `dot-weaver` beats the weak `aggro-brute` baseline;
  `aggro-brute` loses outright (0%) on late/impossible — its underperformance
  IS the design.
- Status engagement > 0.2 on every non-impossible stage.

## 2. Pool audit (per-stage eligible pool, §4 ratio targets)

| Pool | DoT (≥25%) | control (≥15%) | direct-dmg (≤20%) | GUARD/color | befriend | verdict |
|---|---|---|---|---|---|---|
| full (49) | 29% | 22% | 14% | body2/mind1/heart2 | 1 | healthy |
| early (12) | **17%** | 17% | **25%** | body1/mind1/**heart0** | 1 | gaps |
| mid (35) | 26% | 20% | 20% | body2/mind1/heart1 | 1 | healthy |
| late (49) | 29% | 22% | 14% | body2/mind1/heart2 | 1 | healthy |

The full/mid/late pools are healthy. The **early (tier-1) pool** misses three
targets: DoT thin (17% vs ≥25%), direct-damage high (25% vs ≤20%), and **no
heart-color GUARD**. Sharpening the DoT miss: the early DoT line is only
`achilles-gambit` + `hasty-generalization` — **both body-stance, both
`debuff_bleed`.** A player rolling mind/heart dice early has no DoT to power,
so the doctrinal status path collapses to a body-die gate and the fight drifts
toward basic-attack trading — the exact failure the doctrine warns against.

## 3. Headline diagnosis — the "dead cards" are a policy-argmax artifact, not a pool defect

The baseline matrix reports only **40/49** eligible cards exercised, with 9
"never played": `achilles-overtake, apophatic-aegis, bootstrap-paradox,
existential-collapse, existential-debt, pascals-wager, ship-in-a-bottle,
sorites-cascade, tu-quoque`. A naive read is "9 dead cards, buff them." That
read is wrong. Diagnostic evidence (throwaway `_diag` harness, since removed):

- **They are drafted.** Over 2000 focus-varied drafts on the late pool each of
  the 9 appears 287–491 times (≈15–25% of decks). They are not excluded.
- **They project fine.** Every one resolves to a valid `CombatCard` with a real
  verb class; zero library cards project to `null`.
- **They are played when not out-competed.** Forced into a 2-card deck
  (card + guard + retreat), every policy plays each of them heavily (400+
  plays / 40 seeds).

So they are drafted, valid, and playable — they simply never win the sim
policies' **single-best-card argmax** when a dominant sibling
(`slippery-slope`, `transcendent-synthesis`, …) is also in hand. The coverage
meter counts argmax-plays, so it structurally cannot credit pool *diversity*.
The dead set is also RNG-stream-sensitive: promoting one card (§4) shuffled it
from 9 members to a different 7. **Conclusion: do not buff these cards to satisfy
the coverage meter** — that would inflate cards to mask a harness limitation
(explicitly forbidden). The gap is in the measurement, not the pool.

## 4. Applied — promote `corrosive-regress` (tier-1 mind poison)

**Hypothesis:** the early DoT line's body-bleed monopoly (§2) is a genuine
pool-completeness gap independent of the coverage-meter artifact. A tier-1
MIND poison lets mind-die players weave DoT early.

**Sandbox A/B** (`--sandbox=early-dot-color`, identical seeds, control = library
without the card, treatment = with):

| early | win | statusEng | dotFrac | rounds |
|---|---|---|---|---|
| control | 92% | 35% | 47% | 6.5 |
| treatment | 94% | **43%** | **66%** | 2.5 |

`mid`: dotFrac 41%→75%, win 39%→45%. `late`: multi-seed (2,3,7) control win
swings **15%–82%**, treatment tracks it either side — i.e. late win deltas are
seed variance, not the card.

**Calibration:** intensity 1 / duration 2 + a mind-tally threshold — a clone of
`achilles-gambit` (the *gentler* of the two existing tier-1 DoTs) in a new
color, chosen over an int2/dur2 (`hasty-generalization`) clone because the
hotter tune leaned harder on the round-compression noted below.

**Honesty caveat (load-bearing):** the sim's per-run outcomes ride a shared
seeded RNG stream, so adding one card to the pool perturbs *every* draft's
draws. Part of the early dotFrac/statusEng lift is that perturbation, not the
poison landing — as a library card the poison is only marginally argmax-played
on the early stage (same §3 dominance effect). The **robust, seed-independent**
justifications for promotion are: (a) it fills a real pool gap — a mind-colored
tier-1 DoT where there was none; (b) it is exercised in the full matrix (43/50)
and force-playable (card-coverage e2e); (c) it does **not** move the balance
bands. The measured early lift is real in direction but soft in magnitude — do
not read the A/B table as a precise effect size.

**Gate results (all green with the card in the library):**

```
balance-bands.sim (THE contract, 200 seeds) ......... 8/8
card-coverage.sim (corrosive-regress force-playable)  52/52
curated-library (count pin 49→50, dice-layer text) .. 8/8
hazard-pattern-combat.balance.sim (oracle, must not move) 20/20
npm run verify -w axiomancer-mechanics .............. 2152 tests + build
npm run verify -w axiomancer-mobile (Cards/** changed) 2379 tests
npm run type-check -w axiomancer-card-editor ........ clean
```

## 5. Considered but not applied

- **int2/dur2 (`hasty-generalization` clone) of the poison** — deepened DoT
  slightly more but compressed early fights toward ~2 rounds and shifted
  greedy/blind from a mercy-heavy to a kill-heavy outcome mix. Kept the gentler
  int1/dur2 tune.
- **Buffing the 9 "matrix-dead" cards** — rejected per §3; they are healthy
  cards the argmax under-plays, not weak cards.

## 6. Propose-only (out of forge scope)

1. **Impossible ceiling is cracked (81% win; greedy/blind/turtle/chaos all
   ~100%).** The balance-band e2e's impossible assertion only requires
   "not scripted-unwinnable / still loses sometimes," which passes — but the
   *design intent* (winRate ≤ 0.15) is missed. The lever is a threat-damage /
   Conviction **engine constant**, not a card. → **manual engine-constant
   tuning follow-up** (the combat-tuning loop was trimmed at the monorepo
   merge). Do not compensate by nerfing cards.
2. **Coverage/policy harness can't credit pool diversity (§3).** Because every
   policy plays only the argmax, a diversifying card reads as "dead." Consider
   either a coverage metric that counts *drafted-and-force-playable* (not just
   argmax-played), or a policy that plays its second-best when the dominant
   option is absent from hand — so pool-diversity fixes become measurable.
   Both touch harness machinery (`combat.sim-policies.ts` / the coverage e2e)
   → propose-only.

## 7. Open questions

- Is faster early combat (and the greedy/blind mercy→kill outcome shift the
  hotter poison caused) desirable, or should the early game stay a slower
  teaching arc? A genuine design call — flagged for `/oversight`. The applied
  int1/dur2 tune minimizes this; the int2/dur2 variant is documented in §5.
- Single-card dominance (`slippery-slope` is the most-played card by a wide
  margin) was **not** measured this tick: `runOneEncounter` does not surface
  per-card win-impact attribution, so the <70%-of-a-win anti-spam target needs
  a dedicated attribution-share harness. Deferred rather than guessed.
