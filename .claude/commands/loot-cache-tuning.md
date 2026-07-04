---
description: Loot-cache encounter (The Reliquary) balance loop — seeded policy-EV probes over the pure engine to analyse Pick Pool dice-pool odds, jam bite weight, layer payouts, and Insight value against the informed > blind > coward doctrine; numeric changes + report via PR.
---

> **⚙️ Runs against the `axiomancer-mechanics` package.** Repo-relative paths below
> (`src/…`, `automation/…`, `scripts/…`) are relative to that package — run from it (`cd axiomancer-mechanics`) or via
> `npm run <script> -w axiomancer-mechanics`.

# Skill: loot-cache-tuning

> **High autonomy within hard guardrails.** Analyse the Loot-cache
> encounter's ("The Reliquary") push-your-luck economy — Pick Pool dice
> odds, jam bites, layer payouts, Insight value, and outcome-tier rates —
> against the shipped doctrine. Deliver findings and any numeric changes on
> ONE new branch + PR. Nothing auto-lands on `main`.

## North star — knowledge is the skill

The Reliquary is push-your-luck on a LIVE dice-pool "Pick Pool" (redesigned
2026-07-03; see `docs/encounters/loot-cache.md`): three layers, each with a
PUBLIC difficulty (no hidden information — the old sealed `trapped` flag and
free `probe` are gone). The player rolls a d6 pool against the layer's
difficulty each push, banking progress; too many slipped dice in one roll
jams the pick — bites vitae, spoils that layer's loot, and closes only that
layer (the session continues to the next decision). A single per-session
**Insight** charge grants a bonus die, spendable only before a layer's first
roll. Two contracts are LOCKED — never tune against them:

1. **Difficulty is public and honest.** Every layer's difficulty is visible
   from session creation; the engine must never hide it or resolve a
   layer's fate before the player's own roll. Insight adds a die — it does
   not reveal or reroll anything.
2. **The cache maims, it never kills.** Bites settle at claim with a
   host-side floor of 1 vitae. The engine accrues; the host floors.

The tunable doctrine on top:

> **The informed delver beats the blind delver beats the coward —
> in that order, by a margin a player can feel.**

Spending Insight well (on the deepest/riskiest layer attempted) must be the
best policy in expectation; always-pushing must out-earn early-retreat on
average but carry real teeth (the stung tier hurts); retreating early after
the lid must stay the safe, modest floor. If blind greed matches informed
Insight play, Insight — the whole skill expression of the encounter — is
dead weight.

**Known tuning trap (already fixed once, verify it stays fixed):** naively
adding Insight's bonus die while holding `jamSlipThreshold` fixed *raises*
jam odds (more dice rolled, same 2-slip trigger: a 4-die roll jams ~13.2% of
the time vs. ~7.4% for 3 dice). The shipped fix lets a channeled push's jam
threshold rise by `insightBonusDice` for that roll only
(`lootcache.engine.ts`, `pushLootCachePick`). Any future dice-pool retuning
must re-verify Insight stays net-positive on risk-adjusted value, not just
raw currency.

## 1. Purpose

`/loot-cache-tuning` is the Reliquary balance loop. It reads the shipped
dials (`LOOT_CACHE_TUNING` in `lootcache.engine.ts`), exercises the engine
with seeded policy probes via `lootcache.sim.ts`, interprets results against
the targets below, and delivers a report — with any applied numeric changes
and any propose-only structural findings — on one branch and PR.

The empirical witnesses, in order of preference:

1. **The hermetic e2e suite** —
   `src/World/LootCache/e2e/lootcache.engine.test.ts`. It pins public
   difficulty, roll determinism, jam-closes-only-that-layer (not the whole
   session), resist-after-max-pushes, retreat, Insight's once-per-session /
   pre-first-roll gating, the tier taxonomy, and the payout floors.
2. **Seeded policy probes** — `lootcache.sim.ts` / `runLootCacheSim` /
   `generateLootCacheBalanceReport`, exercised at ≥ 200 seeds × these
   policies (a representative authored payload is the default: 1–2 items +
   10 currency):
   - **prudent** — delve each layer but retreat after one push; stop
     delving new layers once bitten once this session.
   - **greedy** — always delve, always push to crack or resist, never
     retreats, never channels Insight.
   - **informed** — plays like greedy, but spends the single Insight charge
     on the deepest layer it attempts, before that layer's first roll.
   Record per policy: avg currency kept, items kept rate, avg bitten vitae,
   avg layers opened, tier distribution, and both the `currencyGradient`
   and `riskAdjusted` gradients from `generateLootCacheBalanceReport`.

## 2. Invocation

```
/loot-cache-tuning
/loot-cache-tuning --focus="dice-pool difficulty"
/loot-cache-tuning --focus="jam odds"
/loot-cache-tuning --focus="layer payouts"
/loot-cache-tuning --focus="insight value"
```

## 3. Autonomy contract

- **Numeric only.** The skill may change values in `LOOT_CACHE_TUNING`
  (per-layer `difficulty`, `trapBite`, `pickPoolSize`, `maxPushesPerLayer`,
  `jamSlipThreshold`, `insightBonusDice`, `falseBottomBonus`, `tithesBonus`,
  `falseBottomFloor`). Structural changes (layer count, a second Insight
  charge, new resolution branches, engine edits beyond the jam-threshold
  scaling already shipped) are **propose-only**; layer/keepsake PROSE is
  narrative surface — never edit copy under this skill.
- **The two contracts are locked.** Anything that hides a layer's
  difficulty, lets Insight reveal/reroll instead of adding a die, or pushes
  the kill floor below 1 vitae is rejected outright.
- **Baseline before delta; evidence before edits; same seeds re-run
  after; `npm run verify` after any change; one PR carries everything;
  unknown is acceptable, false certainty is not.** (Identical contract
  to the sibling tuning skills — see `/hazard-tuning` for the long
  form.)

## 4. Design targets (the objective function)

| Axis | Target |
|---|---|
| Policy gradient | informed risk-adjusted value > greedy risk-adjusted value > prudent risk-adjusted value, by a margin a player can feel |
| The lid | cracked in ~1 push on average (difficulty 5 vs. ~10 expected `gained` per 3d6 roll); always worth a first push |
| Jam odds | ~7.4% per push at base pool size (`Binomial(3, 1/6)`, `P(slips≥2)`); compounds across pushes on deeper layers |
| Bite weight | avg bitten vitae under greedy play lands felt-but-not-crippling pre-floor (watch `avgBitten` in `runLootCacheSim`) |
| Insight value | `informed.avgBitten < greedy.avgBitten` and `informed.stungRate < greedy.stungRate`, while `informed.avgCurrency` stays ≥ ~95% of `greedy.avgCurrency` — Insight trades a little raw greed for a real safety edge |
| Tier distribution (informed) | 'emptied' dominates; 'stung' meaningfully less common than under greedy |
| Zero-purse caches | hidden-layer floors keep deeper layers non-trivial even when the authored purse is 0 |

Doctrine constants (`LOOT_CACHE_TUNING`): difficulty 5 / 9 / 13 by layer;
jam bites 1 / 2 / 3; pick pool 3d6, jam on 2+ slips, 4 max pushes per layer,
1 bonus die per Insight charge; false bottom pays +50% of the authored
purse (floor 3); the keeper's tithe doubles it (floor 3) and mints the
keepsake.

## 5. The procedure

1. **Sync & sanity** — clean tree; cold-run
   `npx vitest run src/World/LootCache`.
2. **Read the surfaces** — `lootcache.engine.ts` (tuning + chrome + the
   push/jam/resist/finish logic together), `lootcache.types.ts` (the
   public-difficulty / pick-state contract), `lootcache.sim.ts` (the three
   policy bots), and the e2e + balance-sim suites.
3. **Run the evidence matrix** — e2e + `runLootCacheSim` /
   `generateLootCacheBalanceReport` over ≥ 200 seeds per policy. Keep raw
   outputs in `/tmp`.
4. **Map evidence against targets**, explaining mechanisms (e.g. "informed's
   risk-adjusted edge shrank because the tithe's difficulty rose without a
   matching bump to `insightBonusDice`'s jam-threshold offset — re-derive
   the per-roll `gained`/jam math rather than eyeballing it").
5. **Apply numeric changes** one axis at a time; re-probe the same seeds;
   `npm run verify` after each; band moves deliberate and documented or
   reverted.
6. **Deliver** — one branch, one PR.
