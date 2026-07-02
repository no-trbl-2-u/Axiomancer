# Skill: rest-tuning

> **High autonomy within hard guardrails.** Analyse the Rest encounter's
> ("The Night Watch") heal economy — posture gradient, warmth/firewood
> dials, watch-bag composition, comfort math, and dawn-tier rates —
> against the shipped doctrine. Deliver findings and any numeric changes
> on ONE new branch + PR. Nothing auto-lands on `main`.

## North star — a night can be meagre, never lethal

The Night Watch replaced the silent `healFraction` grant with one night
at camp in three watches. Two contracts are LOCKED — never tune against
them:

1. **Never lethal.** Every path out of the dark heals ≥ 0. Stirs and
   cold only thin the morning's measure; no tuning change may let a rest
   reduce vitae.
2. **Two-way at claim only.** The engine never reads `GameState`; the
   host applies the dawn outcome (heal fraction, cleanse, keepsakes).

The tunable doctrine on top:

> **Posture is a real bet: richer sleep against an unwatched dark.**

Deep sleep must out-heal dozing must out-heal keeping watch ON THE BASE
RATE — but the watch posture buys stir immunity and watchful finds, and
the dozer gambles. The witness for healthy play is a player who picks a
posture because of what the night might hold, not because one row
dominates. The fire is the second bet: wood is scarce enough that
feeding it (toward warmth-gated cleansing) costs something real.

## 1. Purpose

`/rest-tuning` is the Night Watch balance loop. It reads the shipped
dials and content (`rest.content.ts` — `REST_TUNING`, postures, the
watch bag, dreams), exercises the engine with seeded policy probes,
interprets results against the targets below, and delivers a report —
with any applied numeric changes and any propose-only structural
findings — on one branch and PR.

The empirical witnesses, in order of preference:

1. **The hermetic e2e suite** —
   `src/World/Rest/e2e/rest.engine.test.ts`. It pins the posture
   gradient (deep ≥ doze ≥ watch under identical choices), the heal
   bounds [0, 1], `baseHealFraction` scaling, the cleanse gate, and the
   tier cuts.
2. **Seeded policy probes** — no `rest.sim.ts` exists yet (a standing
   propose-only suggestion). Probe with a scratch driver over ≥ 50 seeds
   × the 3 postures × at least these option policies:
   - **tender** — always feed, always let dreams fade (max heal).
   - **hoarder** — always spare the wood, always hold dreams (min heal,
     max keepsakes).
   Record per cell: healFraction, tier, cleansed rate, keepsakes minted.

## 2. Invocation

```
/rest-tuning
/rest-tuning --focus="posture gradient"
/rest-tuning --focus="warmth economy"
/rest-tuning --focus="cleanse gating"
/rest-tuning --focus="tier cuts"
/rest-tuning --focus="watch bag"
```

## 3. Autonomy contract

- **Numeric and content-level only.** The skill may change values in
  `REST_TUNING` (watch count, warmth start/max, wood start, heal-per-
  warmth/comfort, cleanse gate, tier cuts), posture `baseHeal`, and the
  watch-bag composition in `REST_WATCH_BAG`. Structural changes (new
  watch kinds, new postures, dream authoring beyond numbers, engine
  edits) are **propose-only**; dream PROSE is narrative surface — never
  edit copy under this skill.
- **The two contracts are locked.** Anything that lets a night harm the
  player or read live game state is rejected outright.
- **Baseline before delta; evidence before edits; same seeds re-run
  after; `npm run verify` after any change; one PR carries everything;
  unknown is acceptable, false certainty is not.** (Identical contract
  to the sibling tuning skills — see `skills/combat-tuning.md` for the
  long form.)

## 4. Design targets (the objective function)

| Axis | Target |
|---|---|
| Lethality | heal ≥ 0 on EVERY seed × posture × policy cell (hard invariant) |
| Posture gradient | tender-policy heal: deep > doze > watch (strict on averages, ≥ on any seed) |
| Posture spread | deep ≈ 1.5–2.5× watch on average heal — wide enough to matter, narrow enough that watch stays playable |
| Warmth economy | tender play reaches the cleanse gate (warmth ≥ 3) on a majority of seeds; hoarder play rarely does |
| Stir teeth | the deep sleeper's expected stir cost is visible in the deep-vs-doze gap on stir-bearing seeds |
| Tier rates (tender, deep) | 'restored' is the modal tier |
| Tier rates (hoarder, watch) | 'meagre' is common — the floor exists |
| Keepsakes | hoarder play banks ≥ 1 keepsake on dream-bearing seeds (the trade is real) |

Doctrine constants (`rest.content.ts`): 3 watches from a 9-slip bag
(3 embers / 3 dreams / 2 stirs / 1 still); warmth 0–4, start 2, wood 2;
heal = posture base + 0.04/warmth + 0.05/comfort, scaled by the authored
`baseHealFraction`; cleanse at warmth ≥ 3; tiers cut at 0.55 / 0.35.

## 5. The procedure

1. **Sync & sanity** — clean tree; cold-run
   `npx vitest run src/World/Rest`.
2. **Read the surfaces** — `rest.content.ts`, `rest.engine.ts` (the
   stir-resolution table is posture policy), and the e2e suite.
3. **Run the evidence matrix** — e2e + the seed × posture × policy
   probe. Keep raw outputs in `/tmp`.
4. **Map evidence against targets**, explaining mechanisms (e.g. "watch
   out-healed doze on stir-heavy seeds because the watcher's find gives
   +1 comfort — that's doctrine, not a bug; the gradient target applies
   to the tender policy on stir-free seeds").
5. **Apply numeric changes** one axis at a time; re-probe the same
   seeds; `npm run verify` after each; band moves are deliberate and
   documented or reverted.
6. **Deliver** — one branch, one PR. Standing propose-only suggestion:
   a `rest.sim.ts` with codified policy bands.
