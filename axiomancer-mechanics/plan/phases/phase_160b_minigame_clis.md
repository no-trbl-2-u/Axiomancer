# Phase 160b — Minigame CLI play loops + hazard sim-harness deck injection

**Goal:** Make the Phase 137 pure minigame engines manually (and agent-)
playable in the Node host, mirroring the existing `npm run gathering` /
`npm run hazard` drivers, and let the hazard harness inject a custom acquired
deck so a utility-rich bag can be A/B-tested against the starter bag.

**Source:** NEEDS_ATTENTION.md §4 (CLI does not play the Phase 137 minigames)
+ PHASE_CANDIDATES "Hazard simulation harness" (`--deck`/`--bag-file` injection
+ utility-aware bot). Deferred from Phase 160 (the conditional "if manual play
is wanted" half).

## Scope decision (split from the build-plan row)

The build-plan 160b row names three CLI play loops (rest / loot-cache /
quest-board) plus the hazard deck injection. The QuestBoard engine is by far the
largest of the three (many space kinds, charms, vows, dusk/parley/market) and a
faithful play loop for it is its own slice. To keep this phase shippable and
correct, 160b ships:

1. **`rest.cli.ts`** — Night Watch play loop (posture → 3 watches → dawn).
2. **`lootcache.cli.ts`** — Reliquary play loop (delve / probe / seal).
3. **Hazard `--deck` / `--bag-file` injection** + a confirming utility-aware
   bot test (the hazard `--auto` bot already fires draw/convert utilities first;
   the gap is *feeding* a custom bag so that policy has utilities to exploit).

QuestBoard's CLI play loop is carved out to **Phase 160c** (new build-plan row).

## Commit units

1. **`rest.cli.ts` + `npm run rest` + e2e.** Reuse the `rest.sim.ts` policy
   shapes for `--auto` (posture map + `pickOption`). Shared `io.ts` surface
   (`--script`/`--stdin`/`--json-events`/`--state-log`), `--seed`, `--runs`,
   `--posture deep|watch|doze`, `--base-heal <f>`. Subcommand wiring in
   `game.cli.ts` (`rest`).
2. **`lootcache.cli.ts` + `npm run loot-cache` + e2e.** Reuse `lootcache.sim.ts`
   `decide()` for `--auto` (greedy/prudent/prober). Flags: `--policy`, `--seed`,
   `--runs`, `--currency <n>`. Subcommand wiring (`loot-cache`).
3. **Hazard `--deck` / `--bag-file` injection + utility-aware-bot e2e.** Add
   `--deck <id,id,...>` (acquired card ids appended to the starter bag via
   `hazardDeckBag`-style decode) and `--bag-file <path>` (JSON array of card
   ids = the FULL bag, replacing the starter). Validate ids against
   `HAZARD_DECK`. New e2e asserts an injected utility-heavy bag is drawn and the
   auto bot stages the draw/convert utilities.

## Decisions

- **D1 — Reuse sim policies, don't re-author.** `--auto` for rest/loot-cache
  drives the exact policy logic already in `rest.sim.ts` / `lootcache.sim.ts`
  (single source of bot truth), exposed via a `--policy` flag defaulting to the
  balanced read (`fire-tender` / `prober`).
- **D2 — `--deck` appends, `--bag-file` replaces.** `--deck` is the "I acquired
  these on top of the starter" case (mirrors `appendAcquiredCard`); `--bag-file`
  is the "pin the entire draw bag" case for deterministic harness A/B. Both
  validate ids against `HAZARD_DECK`; unknown id throws with the known list.
- **D3 — Engines untouched.** All three are pure already; the CLIs only parse,
  prompt, dispatch verbs, and format. No `src/index.ts` change (CLI is not the
  public barrel). No new engine exports needed beyond what the barrels expose.
- **D4 — Determinism + illegal-action logging** mirror the gathering/hazard
  CLIs exactly: every transition goes through a `step()` wrapper that logs an
  `illegal<Game>Action` with a state snapshot on a no-op return.

## Verify gate

`npm run verify` green; new `src/CLI/e2e/{rest,lootcache}.cli.engine.test.ts`
plus extended `hazard.cli.engine.test.ts` pass.

## DoD

- [x] `rest.cli.ts` + `npm run rest` script + e2e
- [x] `lootcache.cli.ts` + `npm run loot-cache` script + e2e
- [x] hazard `--deck` / `--bag-file` injection + utility-aware-bot e2e
- [x] `game.cli.ts` dispatches `rest` / `loot-cache` subcommands
- [x] `docs/world.md` Node Event Dispatcher note: CLI now plays Rest + Reliquary
- [x] NEEDS_ATTENTION §4 narrowed (QuestBoard loop carved to 160c)
- [x] `npm run verify` + `npm run deploy:check` clean
