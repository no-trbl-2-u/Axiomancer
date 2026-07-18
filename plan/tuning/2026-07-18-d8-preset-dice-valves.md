# Phase D8 — the valve promotion court (2026-07-18)

> Dated tuning report — the per-preset A/B evidence behind the D8 seat map.
> Instrument: `runPlaytestMatrix`, early stage, full enemy roster, policies
> {blind, greedy}, seeds 1–5, runs 20 per cell, **flag-ON** (Upgradeable
> Dice), sandbox set `dice-valves-33` applied pre-promotion. 1,200 runs per
> arm per preset. Owner-started session (T direct); priority attention on the
> wounded five (standstill, penitent, augury, erosion, tithe) from the
> 2026-07-18 metrics accumulation.

## Verdict table

Baseline = current flag-on preset deck. Valve arm = same deck with exactly one
same-aspect instance of `replaces` swapped for the valve. Δ noise floor at
1,200 runs/arm ≈ ±2pt (1σ on the delta).

| preset | valve | replaces (one instance) | aspect | win base→valve | statusEng base→valve | valve plays / draws / paid | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | recurring-symptom | slippery-slope (1 of 4) | body | 83.3→85.8 (+2.5) | 21.8→22.0 | 908 / 1170 / 224 | **keep** |
| oratory | restate-the-point | exordium (1 of 4) | heart | 88.0→89.8 (+1.8) | 18.3→16.5 | 1096 / 1428 / 414 | **keep** |
| foundry | forge-masters-stamp | anvil-of-form | mind | 58.8→58.7 (−0.1) | 0.0→0.0 | 1426 / 1426 / 702 | **keep** |
| penitent | bleed-for-it | pact-of-akrasia | body | 51.0→51.3 (+0.3) | 22.7→24.6 (+1.9) | 1802 / 1894 / 854 | **keep** |
| standstill | break-the-tempo | red-herring (1 of 4) | mind | 50.0→59.3 (**+9.3**) | 21.5→20.2 | 2102 / 2156 / 554 | **keep** |
| augury | second-sight | ~~glimpse~~ → prophecy-fulfilled | mind | 38.0→40.3 (+2.3) | 17.9→18.5 (+0.6) | 1846 / 2018 / 382 | **keep (re-seated)** |
| tithe | bank-the-yield | stuck-in-their-head | heart | 75.2→74.3 (−0.9) | 23.5→23.7 | 1624 / 1872 / 164 | **keep** |
| grace | change-of-heart | soft-word (1 of 4) | heart | 71.3→70.7 (−0.6) | 0.0→0.0 | 1456 / 1486 / 672 | **keep** |
| bastion | hold-the-line | the-adamant-wall | body | 77.2→76.7 (−0.5) | 32.2→32.4 | 1676 / 1830 / 158 | **keep** |
| refrain | second-take | ouroboros | mind | 82.7→81.8 (−0.9) | 23.4→24.6 (+1.2) | 1026 / 1456 / 134 | **keep** |

**Every themed valve passed — the dual-reroll fallback was never needed.**
Every valve was seen (draws ≥ 1,170 per 1,200-run arm), played (plays ≥ 908),
and fired its die-verb on the PAID line (paid ≥ 130; Master's Stamp fires per
special via its persistent hook — its 702 "paid" figure is enchantment paid
plays). Zero fizzles on all ten valves across the whole court.

## Court notes

- **standstill +9.3 is the headline** — exactly the wounded-five repair D8 was
  queued for. `break-the-tempo`'s CONVERT-to-WILD un-strands the denial deck's
  off-color dice.
- **augury re-seat.** The staged seat (displacing one `glimpse`) measured
  **−5.7** — glimpse is a staple engine (45% status-land in the 07-18
  accumulation) and the valve is not worth a copy of it. Two alternative seats
  measured: `prophecy-fulfilled` +2.3 and `the-oracles-eye` +3.3 — but the eye
  is a HEART card and `second-sight` is MIND, so that seat is illegal under the
  5/5/5 law (the structural test caught it; the court script had not checked
  aspects). `prophecy-fulfilled` (mind, +2.3, statusEng +0.6) is the ratified
  displacement.
- **Three seats subtract measured drags** (07-18 card triage): foundry cuts
  `anvil-of-form` (dWR −11), penitent cuts `pact-of-akrasia` (dWR −9), refrain
  cuts `ouroboros` (25% fizz). tithe cuts `stuck-in-their-head` (watch, −4).
- Neutral-band seats (foundry, tithe, grace, bastion, refrain within ±1σ) keep
  their valves on the structural law: the phase's goal is the affordance, not
  a win-rate buff (brief: "D8 does not require a passing curve").

## The ten-in/ten-out library ledger

**In (promoted from `dice-valves-33`):** recurring-symptom, restate-the-point,
forge-masters-stamp, bleed-for-it, break-the-tempo, second-sight,
bank-the-yield, change-of-heart, hold-the-line, second-take.

**Out (retired):** achilles-and-the-tortoise, ad-nauseam, captive-audience,
entropy-tax, fated-course, heart-of-the-matter, memento-mori,
practiced-cadence, straw-mans-jab, the-tithe.

Retirement proof: these ten were the library's only cards referenced by **no**
flag-on or flag-off preset (the 5/5/5 reward-only set), and the 2026-07-18
metrics accumulation measured them at **zero plays in 345,600 encounters** —
the ledger is forced by the reference law and vindicated by the data.
`entropy-tax`'s engine hook (kindled/floating-spend mark) was removed with it.

Shape consequence (documented, intentional): the spec-32 per-theme symmetry
(7 cards / 2C 2U 3R / 1 ench + 1 dis per theme) is broken by the swap —
peroration and harvest drop to 6 cards, akrasia and bulwark rise to 8;
peroration, forge, control, oracle and harvest lose their ench-or-dis pair
symmetry. The curated-library lints re-pin to the post-D8 table; restoring
per-theme symmetry (authoring replacement ench/dis cards) is follow-up
material for the next library phase, not D8.

## Post-promotion gate rerun (final D8 tree)

Blind policy, per preset, all stages, seeds 1–5 × runs 20, flag-ON valve
decks (bands: early ~80 / mid ~50 / late 25–35 / imp 0):

```
preset      early  mid   late  imp   statusEng(early)  valve casts/run(early)
erosion       86    27     0    0        22%                 0.76
oratory       90    66    23   19        17%                 0.91
foundry       59     0     0    0         0%                 1.19
penitent      51    10     0    0        25%                 1.50
standstill    59     0     0    0        20%                 1.75
augury        40     0     0    0        18%                 1.54
tithe         74     4     0    0        24%                 1.35
grace         71     0     0    0         0%                 1.21
bastion       77     2     0    0        32%                 1.40
refrain       82    18     4    0        25%                 0.85
```

- **Every valve fires in real play** — 0.76–1.75 casts per early run across
  all ten presets; zero dead valves (Press Fate's D7 0.000 casts/round is the
  contrast). The D8 outcome (a live, player-controlled whiff valve in every
  deck) is delivered.
- **Early-band movement where the court promised:** standstill 50→59,
  erosion 79→86, augury 38→40 blind-early vs their pre-valve flag-on marks;
  the wounded five all move up or hold.
- **The curve stays red at mid/late** (and oratory still beats the
  unwinnable) — expected and out of D8's scope by the brief's own law ("D8
  does not require a passing curve"); it becomes the next bounded tuning
  phase, now measurable with valves live.
- `combat-dice-economy --seeds=1..8`: economy witness runs green on the final
  tree; conviction income ~1.2–2.0◆/round, surge ratio 0.04–0.34, no stalled
  economies.

## Residue (filed, not fixed here)

- `combat.engine.ts` still carries the `fated-course` telegraph-forcing hook
  (~lines 4011/4059) keyed on the retired card's id — unreachable in live play
  (no preset or reward can field the card), but the oracle-omen-v2 e2e uses it
  as a deterministic telegraph harness. Porting that harness onto a live card
  (or a test-only hook id) belongs to the next oracle pass.
- Per-theme shape symmetry (7 cards / 1 ench + 1 dis per theme) is broken by
  the forced ledger (peroration/harvest at 6, akrasia/bulwark at 8; five
  themes lost an ench-or-dis). Restoring symmetry = authoring replacement
  ench/dis cards — next library phase.

## Flag-off truth

`COMBAT_DECK_PRESETS[*].cardIds` untouched — byte-identity pinned by snapshot
test. The valve seats live only in the flag-on derivation
(`buildUpgradeableDicePresetDeck`). No flag flip in this phase.
