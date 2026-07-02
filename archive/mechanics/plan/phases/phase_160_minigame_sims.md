# Phase 160 — Phase 137 minigame sims (Rest + LootCache)

**Goal:** Give the Rest ("Night Watch") and LootCache ("Reliquary") minigames
deterministic policy-bot simulation harnesses with codified balance bands, so
the `rest-tuning` / `loot-cache-tuning` skills can drive real sims instead of
scratch `npx tsx` probes.

**Source:** NEEDS_ATTENTION.md §3 (promoted to Phase 160 by oversight 2026-06-20).

## Scope decision (narrowed from the build-plan row)

The build-plan row for Phase 160 bundled five things. Audit before building
found three of them already done or conditional:

- `quest-board.sim.ts` — **already exists** (shipped earlier with its own
  `quest-board.balance.sim.test.ts`). Not rebuilt.
- The `ts-node` break at `game.cli.ts:185` — **already resolved on main**
  (that line is shop-loop code; `npm run game` runs clean). Nothing to repair.
- CLI subcommands (`npm run rest` / `loot-cache`) + hazard `--deck` injection —
  explicitly conditional ("if manual play is wanted"). Deferred; the CLI is a
  combat/balance harness today (NEEDS_ATTENTION §4) and the sims are the
  load-bearing deliverable.

What genuinely does NOT exist and is the core of §3: **`rest.sim.ts`** and
**`lootcache.sim.ts`** (Rest and LootCache have hermetic engine suites only —
no sim, no balance band test). This phase ships exactly those two, mirroring
`gathering.sim.ts` / `quest-board.sim.ts`.

## Commit units

1. **`rest.sim.ts` + `rest.balance.sim.test.ts`** — policies that witness the
   posture tension (heal richness vs. stir safety + fire tending). Bands assert
   the incentive gradient and that rest is never lethal.
2. **`lootcache.sim.ts` + `lootcache.balance.sim.test.ts`** — push-your-luck
   policies (blind-greed vs. seal-early vs. probe-then-decide). Bands assert
   that informed probing beats blind greed and that greed pays in bites.
3. **Barrels + docs** — export both sims via the module `index.ts` files
   (re-exported through `src/World/index.ts` via the existing `export *`),
   update `docs/world.md`, and close NEEDS_ATTENTION §3.

## Decisions

- **D1 — Rest policies:** `deep-sleeper` (always SLEEP DEEP, holds dreams),
  `watcher` (always KEEP WATCH, takes comfort), `fire-tender` (DOZE, feeds the
  fire while wood lasts then takes comfort). These span the posture×fire space.
- **D2 — Rest "punishment" axis:** rest can't go lethal, so the band captures
  *thinness of heal* and *cleanse rate*, not damage. `deep-sleeper` should reach
  the highest `restored` rate (richest baseHeal) but the `watcher` trades heal
  for keepsakes; the gradient is heal-richness, not survival.
- **D3 — LootCache policies:** `greedy` (always delve, never probe, never seal),
  `prudent` (delve the safe lid, then seal), `prober` (probe each layer, delve
  only on a clean reading, else seal). `prober` should dominate on net value —
  the probe is perfect information by design, and that is the intended gradient
  (informed push-your-luck is the skill expression).
- **D4 — Determinism:** every run reproducible from seed; runner strides seeds
  by 7919 like the sibling sims. No `Math.random`.
- **D5 — Bands are loose** (±5pp tolerance at 400 runs) — they guard the
  *gradient and its direction*, not exact magnitudes, so content tuning doesn't
  make them brittle.

## Verify gate

`npm run verify` (type-check + test + build) green; new `*.balance.sim.test.ts`
suites pass.

## DoD

- [ ] `rest.sim.ts` + bands test
- [ ] `lootcache.sim.ts` + bands test
- [ ] barrels export both sims
- [ ] `docs/world.md` notes the sims; NEEDS_ATTENTION §3 closed
- [ ] `npm run verify` + `npm run deploy:check` clean
