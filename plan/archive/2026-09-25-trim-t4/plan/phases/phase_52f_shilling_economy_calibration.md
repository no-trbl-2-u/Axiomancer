# Phase 52f — Calibrate the shilling economy against the rest-choice prices

> Agent-facing brief. Replace the provisional numbers 52a/52c shipped
> with figures derived from measured income, and de-placeholder D5's
> blacksmith pricing at the same time. Mechanics (tuning + harness).
> Last of the **rest-choice** epic (52a-52f).

## Why this exists

Three price sets are currently guesses stacked on each other:

| Constant | Where | Status |
|---|---|---|
| `BLACKSMITH_PRICING_PLACEHOLDER` (hone 2 / temper 3 / swap 4) | `World/Blacksmith/blacksmith.engine.ts:52` | PLACEHOLDER since D5, "pending D7's economy ratification" — **D7 never ran** |
| anvil price at a rest node (proposed 50) | Phase 52c | provisional |
| `cardRemovalPrice` (proposed 15 + 10n) | Phase 52a | provisional |

T's ruling (attended chat, 2026-08-08) on pricing was: *I pick, you tune
later* — with a dedicated phase that calibrates against measured
shilling income. This is that phase. Until it lands, "high price" and
"low price to start" are assertions, not measurements.

## Inputs

1. Income sources: `World/LootCache/` (`DEFAULT_CACHE_CURRENCY = 10`,
   plus false-bottom / tithe bonus fractions), combat victory rewards,
   quest-board payouts, `Items/shop.reducer.ts` (`defaultSellPrice` —
   selling is income too, and Phase 37 already fixed one exploit there).
2. Sinks: village shop wares (~1-12 shillings), and now the anvil and
   the cut.
3. `src/CLI/game.cli.ts --route` — the existing map-traversal evidence
   lane (Phase 14 made its coverage honest). This is the natural place
   to measure "shillings earned by end of act 1".
4. `plan/bearings.md` § "Measured truth (baselines)" and
   `npm run baseline:check` — cite the stamp in the report.
5. The sibling tuning skills (`.claude/commands/world-tuning.md`,
   `loot-cache-tuning.md`) for the report + PR shape this should match.

## Scope

- **Measure first.** A seeded probe that reports shillings earned and
  spent across a representative run, per act. No tuning before there is
  a number to tune against.
- **Derive the three price sets from that number**, against a stated
  doctrine. Proposed doctrine, to be confirmed by the measurement:
  - A die upgrade is a **major** purchase — roughly a full act's
    disposable income, so a player upgrades dice a handful of times per
    campaign, not at every node.
  - The first cut is **cheap enough to be obvious** — affordable at the
    first rest node a new player reaches.
  - The escalation should make the **fourth or fifth** cut a real
    sacrifice without making it impossible. Linear, not exponential.
  - `rest` stays free, so a broke player always has a move.
- **De-placeholder `BLACKSMITH_PRICING_PLACEHOLDER`** — rename it to a
  real constant, priced in shillings, and delete the "D7 ratifies"
  comment that has been stale for a month.
- **Decide the tuning home.** `.claude/commands/rest-tuning.md` is
  deleted by 52e. Either fold rest-choice economy probes into
  `world-tuning`, or stand up a small successor command. Do not leave the
  new node with no tuning lane — that is exactly how D5's prices went
  unratified for a month.
- **Report** to `axiomancer-mechanics/docs/reports/` in the shape the
  other tuning skills use, citing the baseline stamp.

## Decisions made upfront — DO NOT ASK

- Prices are shillings. There is one currency; do not introduce a second
  (souls / ◆ appear only as D5-era placeholder unit comments — retire
  that language).
- Linear removal escalation. Confirmed at 52a; this phase tunes the
  slope, not the shape.

## Surface as `[needs-user-call]`

- If the measurement shows income cannot support a meaningful anvil
  price without changing income itself, **stop and surface it**. Raising
  drop rates across the game is an economy change well beyond this
  phase's remit.

## Prove (DoD)

- The report exists, cites a fresh baseline stamp, and shows the
  measured income curve the prices were derived from.
- Hermetic tests pin the new constants and the price curve.
- The tuning lane's successor is wired and documented.
- `npm run verify --workspace axiomancer-mechanics`.

## Follow-ups

- Phase 43's objective function v2 may want the anvil and the cut as
  inputs — a run where the player never touches either is a signal about
  pricing. Note it there; do not build it here.
