> **Archived** 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1). Original path: `axiomancer-mechanics/scratch/price-experiment/report/FINDINGS.md`.

# Card Pricing vs Win-Rate — Findings

**Status:** HISTORICAL — a dated price-experiment snapshot; keyword prose
below (capitulate/concede/sway/rapport) reflects the registry as it read at
capture time, not the live phase-44b-renamed vocabulary (CHARGE/CONDEMN/
PLEA/RELENT/QUARTER).

_Source: `scratch/price-experiment/out/*.json` (10 preset files, 2 ladders, 1 fix-test). Policy `blind`, seeds 2, runs 40–60/cell. "Card price" = the `scoreCard` power-budget (`cards.pricing.ts`); die cost is fixed at 1 die per PAID line, so a higher price packs more status/burst power per die. `winRate` = victory+mercy+capitulate+concede. `avgRoundsToVictory` is victory-only._

## Headline answer

**No — not on its own.** Increasing card price is a **three-regime lever**, not a global win-rate dial:

- **Early (player-strong ceiling):** price is nearly irrelevant. Win-rate is already saturated; extra budget cashes out as **kill-speed**, not wins.
- **Mid:** price genuinely buys wins. This is the one stage where the "price = power" thesis holds — cleanly and causally within a deck.
- **Late (bosses):** a **survival/tempo wall**. Price buys offense but zero survivability, so the player still dies ~1–4 rounds before a slow status kill matures. Price nudges late win-rate a little for a fast deck and not at all for a slow one.

Cross-deck, **price does not cleanly predict win-rate** — win-**path** and **tempo** dominate. To make more price reliably convert to more wins you must price the axis that actually wins fights (front-loaded / faster-maturing power and a sliver of survivability), which the fix-card test confirms works.

**Verdict: PARTIAL.** Price → win-rate at mid; marginal at late; none at early; and cross-deck it is a weak, non-monotone predictor confounded by alt-win paths.

## The three-regime story (with numbers)

Cleanest causal evidence is the **erosion ladder** (same deck, price scaled x0.5→x4, `avgSpell` 7.45→51.11):

| Stage | x0.5 | x1 | x1.5 | x2 | x3 | x4 | Read |
|---|---|---|---|---|---|---|---|
| early winRate | 0.90 | 0.90 | 0.93 | 0.93 | 0.95 | 0.96 | **Ceiling** — +6 pts across ~7x price; cashes out as speed (rtv 2.98→2.53) |
| mid winRate | 0.41 | 0.41 | 0.51 | 0.55 | 0.63 | 0.68 | **Linear conversion** — +27 pts, monotone |
| late winRate | 0.04 | 0.04 | 0.05 | 0.05 | 0.06 | 0.12 | **Walled** — triples but stays a near-total loss |

The **penitent ladder** (slow akrasia DoT) is the skeptic's check and it holds: price does **almost nothing and can hurt** — early 0.79→0.74 (declines at 3–4x), mid peaks at x2 (0.18→0.23) then **falls back to 0.21**, late pinned 0.00–0.01. So within a fixed deck price is **not even cleanly monotonic** for a weak-tempo theme.

**Why late is walled (the mechanism):** in every late cell `avgRoundsToVictory` EXCEEDS `avgRoundsAll`. Erosion late needs ~5.8 rounds to secure a kill but the average fight ENDS at ~4.06 (gap +1.7); penitent needs ~8.0 but ends at ~3.7 (gap +4.3). The death clock (`avgRoundsAll`) is **flat against price** (erosion 4.06→4.13; penitent 3.72→3.49) because price buys the player's OFFENSE, not HP/defense/tempo — the round the enemy kills the player is set by ENEMY output and does not budge. Price only front-loads the kill (erosion required rounds 5.80→5.05, `dotHpFraction` 0.43→0.38 shifting toward burst), which occasionally beats the death clock — hence erosion inches to 0.12 while penitent's 6.5–8-round DoT can never close a 3–4-round gap.

**Skeptic qualifications respected:** (1) The mid gain is monotone for erosion but NOT for penitent (peaks x2, then declines) — do not claim universal monotonicity. (2) "Late is a dead flat wall" is too strong: erosion late **triples** 0.04→0.12 (19→59 victories/480), with the biggest jump at the very top tier — late behaves like a **high-price threshold** that begins to crack, not a perfectly flat line. (3) The cross-deck late correlation is **one deck deep** (Oratory); drop it and late is ~0 everywhere. With seeds=2 the fine-grained monotonicity is the least trustworthy claim; the big erosion mid trend survives, penitent's wobble sits in the noise.

## Average rounds to victory per preset (per stage)

`avgRoundsToVictory` — victory-only. `null` = the deck essentially never wins by KILLING (it wins by capitulate/concede) or has ~0 victories.

| Preset | theme / focus | price avgSpell (total) | early | mid | late |
|---|---|---|---|---|---|
| Refrain | echo / balanced | 7.90 (102.67) | 2.79 | **4.30** | 4.65 |
| Penitent | akrasia / dot | 6.61 (85.97) | 2.97 | 4.83 | 8.00\* |
| Erosion | affliction / dot | 8.09 (105.22) | 2.99 | 4.85 | 5.97 |
| Augury | oracle / balanced | 6.76 (87.94) | 3.49 | 5.43 | null |
| Oratory | peroration / balanced | 7.20 (93.57) | 3.37 | 5.67 | 9.61 |
| Tithe | harvest / rush-execute | 5.46 (70.97) | 3.57 | 9.63 | null |
| Standstill | control / control | 6.02 (78.27) | 3.24 | null | null |
| Bastion | bulwark / balanced | 6.04 (78.47) | 3.46 | null | null |
| Foundry | forge / utility | 7.52 (97.70) | null | null | null |
| Grace | charm / control | 5.46 (70.99) | null | null | null |

\* Penitent late 8.00 rests on **1 victory / 720 runs** (winRate 0.00) — treat as effectively null.

**Read:** kill-speed tracks the win-PATH, not price. Only the pure victory-path DoT/echo decks (Refrain, Penitent, Erosion) post clean rounds-to-victory across early+mid. The capitulate/control decks (Foundry, Grace, Bastion, Standstill) go `null` because they win by enemy **surrender**, not by killing — "faster killing" is undefined for them. Price-vs-mid-rtv Pearson is r≈−0.84 but is outlier-driven (cheap-slow Tithe 9.63); drop Tithe and it collapses to r≈−0.50. Higher price buys a slight kill-speed edge at best.

## Win-path + pricing-model fit — does `scoreCard` predict in-play win-rate?

**No — it is a weak, non-monotone cross-deck predictor, and it inverts for alt-win decks.** It works only as a saturating, ordinal within-deck signal for pure HP/DoT decks. Three independent failure axes:

- **Alt-win blindness (dominant).** Grace and Foundry win purely by CAPITULATE (SWAY) with `statusEngagement` 0.00 and **0 HP victories**; Oratory wins late/impossible mainly by CONCEDE (Premise threshold). `scoreCard` prices these engines at ~0. The **cheapest** deck Grace (5.46) beats the 4th-priciest Foundry (7.52) early (0.73 vs 0.61) — price ranks them **backwards**. The one deck alive late (Oratory, mid-pack 7.20) is carried by 94 concede vs 67 victory — invisible to price.
- **Tempo/duration blindness.** Penitent price x3.5 leaves mid flat (0.18→0.21) and DROPS early (0.79→0.74). Extra magnitude-per-die is worthless when the binding constraint is dice-per-round (fixed 1/PAID) and rounds-survived.
- **Enchant/disenchant = 0.** Foundry posts `statusEngagement` 0.00 and `dotHpFraction` 0.00 at every stage — its 97.70 budget is spell lines it barely wins with; its real work (enchant + SWAY) is unpriced.

Cross-deck: mid Pearson(price, winRate) ≈ 0.57 (r²≈0.33), late ≈ 0.41 — a moderate signal that exists mainly because a deck happens to be HP-damage. High status-engagement does not rescue it either: **Bastion has the highest engagement of any deck (0.44–0.47)** yet only 0.11 mid win-rate (it converts engagement into early CAPITULATE then collapses).

## Fix-card proposal + did price finally convert?

**Proposal (`scratch/price-experiment/proposed/fix-cards.sandbox.ts`):** re-shape erosion's PAID lines to attack the tempo wall — **front-load** the affliction, make the DoT **mature faster**, and add a sliver of **survivability** — so the extra price buys wins-before-death instead of bigger-but-too-slow status.

**Re-test (`out/fix-test.json`, baseline = preset erosion, blind, runs 40, seeds 2):**

| Stage | Baseline winRate | Fix winRate | Baseline rtv | Fix rtv |
|---|---|---|---|---|
| early | 0.90 | 0.95 | 2.98 | 2.92 |
| mid | 0.41 | **0.53** (+12 pts) | 4.84 | 4.71 |
| late | 0.04 | **0.09** (+5 pts, >2x) | 5.80 | 5.56 |
| impossible | 0.01 | 0.01 | 7 | 8 |

Price rose only slightly (`avgSpell` 8.09→8.63, total 105.22→112.20) yet mid win-rate jumped +12 pts and late **more than doubled**, with `avgRoundsToVictory` shortening at both bands and `dotHpFraction` falling (0.42→0.27 late — the wins now come from front-loaded burst, exactly the intended mechanism). **Yes: with the price pointed at the tempo axis, extra budget finally converts to wins** — the lever works once you price the thing that actually wins the fight.

## Temp-enemy proposal (isolate the mechanism)

`scratch/price-experiment/proposed/temp-enemies.ts` — two throwaway, standalone test enemies (real `createEnemy` calls, correct `Enemy` field names, NOT wired into `ENEMY_REGISTRY`; passes strict standalone typecheck). They exploit the verified fact that **HP and telegraph damage are decoupled** (`maxHealth` = (body+heart+mind)×5, level does not multiply HP; threat damage is driven by level+difficulty, not attack stats):

- **The Millstone (Damage Sponge)** — baseStats 100/100/100 → 1500 HP, level 5 + `simple` → ~6 dmg/phase. Isolates the **pure damage race**: with negligible enemy output, more card price should monotonically cut rounds-to-kill and drive win-rate toward ~100% — a clean positive control for "price buys wins."
- **The Hourglass (Glass Racer)** — baseStats 20/20/20 → 300 HP, level 40 + `boss` → ~63→100 dmg/phase plus fast boss clock and a round-6 rage (x1.6 + 50% self-heal). **Exaggerates the tempo wall**: beatable only by burst/survival, hard-walls slow value decks — the foil that stays flat against expensive-but-slow price.

Both strip confounds (no befriend/mercy/capitulate/concede alt-win; single no-drop loot) and fall through to the engine's generated escalating threat + locked round-6 rage. The file carries paste-ready `ENEMY_REGISTRY` + stage-roster registration steps and a ready LATE-HP "Price Probe" stage; revert after probing.

## Recommendations

1. **Stop treating `scoreCard` price as a win-rate dial.** It is a mid-stage, within-deck, HP-damage ordinal signal only. Do not expect cross-deck price rank to predict strength.
2. **Price the tempo axis, not just magnitude.** Reward **front-loaded / faster-maturing** power (and a sliver of survivability) in the budget — the fix-card test converted +12 pts mid / >2x late for +0.5 avgSpell by doing exactly this.
3. **Make `scoreCard` alt-win-aware.** SWAY/capitulate, Premise/concede, and enchant/disenchant currently price at ~0, so whole win engines are invisible and the model ranks alt-win decks backwards (Grace > Foundry).
4. **Fix late via enemies/tempo, not price.** The late wall is a survival/tempo failure the price lever cannot climb (erosion +8 pts even at 4x/664 budget). Address it with the death-clock (enemy output / player survivability) or design alt-win exits like Oratory's concede path.
5. **Re-run with more seeds before trusting fine-grained trends.** seeds=2 makes penitent's non-monotonic mid wobble and early declines noise-dominated; the big erosion mid trend and the late wall survive, the rest needs confirmation.
