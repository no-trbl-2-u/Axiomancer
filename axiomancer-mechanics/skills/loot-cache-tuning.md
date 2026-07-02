# Skill: loot-cache-tuning

> **High autonomy within hard guardrails.** Analyse the Loot-cache
> encounter's ("The Reliquary") push-your-luck economy — trap odds and
> bites, layer payouts, probe value, and outcome-tier rates — against the
> shipped doctrine. Deliver findings and any numeric changes on ONE new
> branch + PR. Nothing auto-lands on `main`.

## North star — knowledge is the skill

The Reliquary is push-your-luck on HIDDEN information: three layers, trap
fates sealed at creation, one probe to read the next seam. Two contracts
are LOCKED — never tune against them:

1. **Fates are sealed, the probe is honest.** Trap states are decided at
   session creation and the probe reveals (never re-rolls) them. No
   tuning change may make the read unreliable.
2. **The cache maims, it never kills.** Bites settle at claim with a
   host-side floor of 1 vitae. The engine accrues; the host floors.

The tunable doctrine on top:

> **The informed delver beats the blind delver beats the coward —
> in that order, by a margin a player can feel.**

Probing then acting on the answer must be the best policy in expectation;
always-delving must out-earn always-sealing on average but carry real
teeth (the stung tier hurts); sealing after the lid must stay the safe,
modest floor. If blind greed matches informed play, the probe — the whole
skill expression of the encounter — is dead weight.

## 1. Purpose

`/loot-cache-tuning` is the Reliquary balance loop. It reads the shipped
dials (`LOOT_CACHE_TUNING` in `lootcache.engine.ts`), exercises the
engine with seeded policy probes, interprets results against the targets
below, and delivers a report — with any applied numeric changes and any
propose-only structural findings — on one branch and PR.

The empirical witnesses, in order of preference:

1. **The hermetic e2e suite** —
   `src/World/LootCache/e2e/lootcache.engine.test.ts`. It pins the lid's
   safety, fate determinism, probe honesty, spoil-on-spring, the tier
   taxonomy, and the payout floors.
2. **Seeded policy probes** — no `lootcache.sim.ts` exists yet (a
   standing propose-only suggestion). Probe with a scratch driver over
   ≥ 200 seeds × at least these policies (expected value per policy is
   the core measurement; use a representative authored payload, e.g.
   1 item + 10 currency):
   - **coward** — open the lid, seal.
   - **blind** — delve all three layers, no probe.
   - **informed** — delve the lid; probe layer 2; delve on dud, seal on
     live. (Optionally a 4th: probe-deep — save the probe for layer 3.)
   Record per policy: avg currency kept, items kept rate, avg bitten
   vitae, tier distribution.

## 2. Invocation

```
/loot-cache-tuning
/loot-cache-tuning --focus="trap odds"
/loot-cache-tuning --focus="bite magnitudes"
/loot-cache-tuning --focus="layer payouts"
/loot-cache-tuning --focus="probe value"
```

## 3. Autonomy contract

- **Numeric only.** The skill may change values in `LOOT_CACHE_TUNING`
  (per-layer `trapChance`, `trapBite`, `falseBottomBonus`, `tithesBonus`,
  `falseBottomFloor`). Structural changes (layer count, a second probe,
  new approach verbs, trap kinds, engine edits) are **propose-only**;
  layer/keepsake PROSE is narrative surface — never edit copy under this
  skill.
- **The two contracts are locked.** Anything that re-rolls a sealed
  fate, makes the probe lie, or pushes the kill floor below 1 vitae is
  rejected outright.
- **Baseline before delta; evidence before edits; same seeds re-run
  after; `npm run verify` after any change; one PR carries everything;
  unknown is acceptable, false certainty is not.** (Identical contract
  to the sibling tuning skills — see `skills/combat-tuning.md` for the
  long form.)

## 4. Design targets (the objective function)

| Axis | Target |
|---|---|
| Policy gradient | informed EV > blind EV > coward EV on total value (currency + items kept), by ≥ ~10% per step |
| The lid | always safe, always worth opening — coward EV strictly > walking away |
| Blind teeth | blind play ends 'stung' on a meaningful share of seeds (with default odds: ~2/3 of runs spring a trap somewhere) |
| Bite weight | avg bitten vitae under blind play lands ~1.5–2.5 — felt, not crippling pre-floor |
| Spoil sting | a sprung layer's lost loot is visible in the blind-vs-informed EV gap (spoilage, not just the bite, carries the punishment) |
| Probe value | the probe's information is worth more than 0 and less than auto-win: informed play still ends 'stung' occasionally (probe-then-delve into an unprobed layer 3) |
| Tier distribution (informed) | 'prudent' and 'emptied' dominate; 'stung' rare |
| Zero-purse caches | hidden-layer floors keep deeper layers non-trivial even when the authored purse is 0 |

Doctrine constants (`LOOT_CACHE_TUNING`): trap chance 0 / 1⁄3 / 1⁄2 by
layer; bites 0 / 2 / 3; false bottom pays +50% of the authored purse
(floor 3); the keeper's tithe doubles it (floor 3) and mints the
keepsake.

## 5. The procedure

1. **Sync & sanity** — clean tree; cold-run
   `npx vitest run src/World/LootCache`.
2. **Read the surfaces** — `lootcache.engine.ts` (tuning + chrome + the
   finish/tier logic together), `lootcache.types.ts` (the hidden-
   information contract), and the e2e suite.
3. **Run the evidence matrix** — e2e + the seed × policy EV probe. Keep
   raw outputs in `/tmp`.
4. **Map evidence against targets**, explaining mechanisms (e.g. "blind
   EV beat informed EV because the layer-2 trap spoils only its own
   bonus currency while layer 3 carries the keepsake — the spoil is too
   cheap, so raise layer-2's share, not the trap odds").
5. **Apply numeric changes** one axis at a time; re-probe the same
   seeds; `npm run verify` after each; band moves deliberate and
   documented or reverted.
6. **Deliver** — one branch, one PR. Standing propose-only suggestion:
   a `lootcache.sim.ts` with codified policy-EV bands.
