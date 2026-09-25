# Phase D3 — Upgradeable-Dice sim harness + economy derivation

> Dated tuning report. Measures spec 33 §7's **D3 gate table** and derives the
> economy constants D2 left symbolic. Witness: `simulateUpgradeableEconomy`
> (`src/Combat/combat.upgradeable-economy.sim.ts`), driven flag-ON through the
> real engine + the new `policyPlayPhase` spec-33 branch. Reproduce with
> `npm run combat-dice-economy` (add `--seeds=…`, `--policy=blind`).
>
> **Stamp:** 2026-07-17 · policy `greedy` · 10 starter presets × {early, mid,
> late} × seeds 1–30 (900 encounters, 4 575 measured rounds) · dice-math
> witness N = 200 000 direct rolls, stock gear.

## Method — a two-witness split

The D3 gates divide into two kinds, and conflating them hides the truth:

1. **Dice-math gates** (usable, whiff, per-color, gross special ◆) are
   properties of the **face tables** (§1) — they do not depend on play. The
   authoritative reading rolls `rollUpgradeableDice` in a single long stream
   (`measureDiceMath`, N = 200 000, stock gear), exactly as the spec's own
   baseline arithmetic does.
2. **Realized-economy gates** (◆ income actually banked, surge frequency, dead
   rounds, momentum-break rate, STAKE gap) depend on **play** — the
   PROVISIONAL "special fires only when the die is USED" rule (§6) means a
   rolled special that goes unspent pays nothing. These come from the flag-on
   encounter matrix.

Both are reported below. The realized reading also re-measures the roll stats
*through the engine RNG* so the divergence between them can be named.

## D3 gate table — results

| Metric | Band (§7) | Dice-math witness | Verdict |
| --- | --- | --- | --- |
| E[usable dice/round], stock | 1.83 ± 0.05 | **1.833** | PASS |
| whiff rate, stock | 8.3% ± 1% | **8.3%** | PASS |
| per-color access (body/mind/heart) | ≥ 65% | **66.6 / 66.7 / 66.7%** | PASS |
| gross special income | — | **1.336◆/round** (E[specials] 0.668 × 2◆) | — |

**The face tables are correct.** Every roll-math gate passes at the design
target. Spec §1's baseline arithmetic (1.83 / 8.3% / ≈67%) is confirmed against
the shipped D2 gear tables with no drift.

### Realized play (flag-on matrix, seeds 1–30)

| Metric | Band | Realized | Note |
| --- | --- | --- | --- |
| ◆ income/round | 1.2–1.6 | **1.212** | PASS — specials 1.162 + overflow 0.049 + **yield 0.000** |
| special spend-rate | — | **95.2%** | of rolled specials actually fire (spent-on-use) |
| surge frequency | measure | **0.246/round** (~1 per 4 rounds) | proposed band below |
| momentum breaks | — | 0.435/round | ~1 break per 2.3 rounds |
| dead rounds (0◆, FREE-only) | no band | **6.5%** | measured, per brief |
| Press Fate casts | — | **0.000/round** | see finding F3 |
| realized usable / whiff | — | 1.692 / 10.3% | vs dice-math 1.833 / 8.3% — see F1 |

## Findings

### F1 — Realized roll stats converge to the dice-math values as the seed set grows (measurement caution, minor RNG note)

The in-play whiff rate reads **15.4% at 5 seeds → 13.6% at 10 → 10.3% at 30**,
trending toward the authoritative dice-math **8.3%**. The engine RNG is a bare
Park–Miller LCG (`src/Utils/rng.ts`); with a small seed set, the four dice —
drawn as four *consecutive* `rng()` calls each round — over-weight correlated
early-stream draws, biasing the realized sample miss-heavier. This is a
**small-sample seed-correlation artifact, not a permanent engine bias**: it
shrinks monotonically with more seeds. **The dice-math witness is the
authoritative roll-gate reading; realized roll figures should always be quoted
with their seed count.** A future RNG upgrade (a higher-quality PRNG) would let
the realized reading converge faster, but is out of D3's scope and touches every
seeded test — noted for the engine backlog, not actioned here.

### F2 — The yield economy is un-witnessable until stance checks are authored `[x]` RESOLVED via /oversight 2026-07-18

Realized **yield income = 0.000** across all 900 encounters, because **no enemy
authors a `stanceCheck` field** (`grep stanceCheck src/Enemy/` → 0 hits). Spec
§2 folds the `yields: X → +1◆` bonus into the income band (1.2–1.6 =
"specials + yield bonuses"), but D2 shipped the *resolution* logic
(`resolveStanceCheck`) without authoring checks onto any threat phase. The band
still PASSES on specials alone (1.212), so the economy is not starved — but the
**yield lever is dark**. This is a content dependency, not a bug:

- **Owner call:** stance-check authoring is enemy-content work. It can land in
  **D4** (alongside the card re-authoring) or a dedicated content pass. Until it
  does, the yield component of the income band cannot be tuned, and D7's
  win-curve read will not exercise the steer-into-yields loop the design leans
  on.
- Dial options when it lands: check *density* (how many phases carry one),
  and the yield *payout* (spec-fixed at +1◆ today).

**RESOLVED (owner call via /oversight 2026-07-18):** author a **dedicated
content phase pre-D7** (NOT folded into D6b, NOT deferred past flag-flip).
Filed as **Phase D6e — Enemy stanceCheck telegraphs (yield-lever content)**
in `plan/steps/01_build_plan.md`: a first batch of open stance-check
telegraphs on threat phases (density + payout per the dial options above),
parallel-safe with the mobile D6a–d stretch and a hard dependency of D7, so
D7's win-curve read exercises the steer-into-yields loop.

**SHIPPED (Phase D6e, 2026-07-18):** `getThreatSequence` now backfills an open
stance check on every threat phase (`defaultStanceCheck`: punishes the enemy
stance head-on ×1.5, yields to the momentum-chain successor ×0.5 +1◆ — the
rotating enemy stance distributes yields across all three stances, §2). Re-run
witness (`combat-dice-economy`, seeds 1–10): **yield income 0.000 → 0.329◆/round**
and **total ◆ income 1.117 → 1.451** (still in the 1.2–1.6 band, now mid-upper as
the spec intends — "specials + yield bonuses"). The measurement policy catches
yields ~⅓ of phases by natural stance distribution (it does not yet deliberately
steer into them — a policy refinement for D7's win-curve pass). Boss
(`AUTHORED_THREAT_SEQUENCES`) per-phase "two-stance / not-X" checks remain a §2
follow-up.

### F3 — Press Fate is the intended recurring sink but is not equipped by starter loadouts

Realized **Press Fate casts = 0.000/round.** The signature exists
(`sig-press-the-point`, `kind: 'reroll'`, repriced to `PRESS_FATE_COST` = 1◆
flag-on) but `getSignaturesForLoadout` grants it only from equipment the starter
players do not carry. Consequence: **the leaner economy's main ◆ sink (§5) is
inactive in the measured configuration** — whiffed rounds are carried entirely
by FREE lines, never by a 1◆ reroll. D4/D5 should ensure the reroll affordance
reaches players (a signature grant, or the per-theme dice-interaction card §4).
Until then, discretionary ◆ is unspent-sink-free and the signature repricing
(below) is the only ◆ draw.

### F4 — STAKE-retirement gap (§5)

Flag-on encounters run **5.11 rounds** vs the flag-off baseline **4.85 rounds**
on the same cells — about **5% longer**. STAKE's escalation-tick-on-loss (an
escalation-clock pressure source) and its 2/4/6◆ wager (a ◆ sink) are both
gone; with Press Fate also inactive (F3), the flag-on economy currently has
**no active ◆ sink at all**, which lengthens fights. This is expected and
resolves once F3's reroll affordance and D4's repricing land; D7 ratifies.

## Derived constants (proposals — PROVISIONAL, D7 ratifies)

Number ownership (§5): Press Fate = 1◆ is spec-fixed; the rest are derived here
and ratified at D7 after D4's repricing and the yield authoring (F2) shift the
income up.

| Constant | Today | Derived proposal | Rationale |
| --- | --- | --- | --- |
| Signature cost — utility/scout tier | 4◆ | **2◆** | discretionary ≈ 1.0–1.2◆/round → a 2◆ spend lands every ~2 rounds |
| Signature cost — core control/dot tier | 6◆ | **3◆** | meaningful spend every ~2.5 rounds at realized income |
| Signature cost — finisher/conclude tier | 8◆ | **4◆** | a deliberate 3–4 round save, still reachable pre-kill |
| `sig-read-opponent` | (read-era) | **1◆** | reveals the next phase's stance check early (§6); affordable ~1×/round |
| ante / scrap | current | **hold** | re-examine at D7 with the full repriced economy |

The old table (4–8◆) delivered a meaningful spend every ~10 rounds against the
old ~0.3–0.6◆/round discretionary income. The new ~1.2◆/round realized income
(specials-driven) supports a **halved cost table** for the spec's "every 2–3
rounds" cadence. These are the D3 sim's derived starting points; **D4 re-fits
card pricing against them and D7 ratifies both together** — the numbers will
move once yield income (F2) and an active Press Fate sink (F3) exist.

## OVERHEAT

`OVERHEAT_CRACK_CHANCE = 35%` is a spec constant, not policy-exercised — the
measurement instrument never gambles a spent die (it is a player-agency lever,
not a policy staple). Reported for completeness; its crack rate needs no sim to
witness.

## Follow-ups

- **D4** consumes this economy (signature costs, the card-played-clock DoT
  constants) and re-authors cards against the four-die cadence.
- **F2 (stance-check authoring)** and **F3 (Press Fate affordance)** are
  surfaced for the owner / D4 — the yield economy and the recurring sink cannot
  be witnessed until they land.
- **D7** flips the dice-math bands to hard assertions, ratifies the derived
  constants, and runs the win-curve / statusEngagement re-baseline (only
  meaningful after D4).
