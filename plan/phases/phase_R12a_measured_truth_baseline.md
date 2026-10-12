# Phase R12a — Measured-truth baseline

> Agent-facing brief, plotted by T (`/plot asap`, 2026-10-12). Tooling
> only: no card, keyword, relic, enemy or art content (D37, D88). Ship
> without asking; record judgment calls in the commit body. The engine
> half of R12; the `/combat-playtest` command design stays attended in
> R12 and consumes what this phase builds.

## Sources

- The `/plot` request (T, 2026-10-12): "run the engine matrix CLI on the
  Blood Price trial set and the 20-card test deck against the Act 1 foes
  and regions, commit the result table to a tracked file, point
  `docs/truth-sources.md` 'Measured truth' at it, and surface a
  diff-on-change signal for `/digest`."
- Part plan: `plan/revamp/loop.md` → "R12 — New combat-playtest" (what the
  matrix should measure: stat growth against the Act 1 curve, survivors
  winnable and dangerous, lowest VITAE per fight).
- Decisions: **D57** (the deck-matrix baseline is retired; a measurement
  becomes a baseline only by T's call — this phase is a measurement with
  history, not a gate), **D37** (THE CARD HOLD: measuring is not tuning),
  **D88** (content per surface: nothing here authors content), **D84**
  (code lands by `loop:pr` PR), **D90** (in-tick defects fixed in-tick).
- Precedent: Phase PF1 (`plan/phases/phase_PF1_weekly_perf_audit.md`,
  D77): the committed-history + pure-compare + orchestrator + workflow
  shape, reused here for balance numbers.
- T's calls in the `/plot` session (2026-10-12): cadence is **on merge to
  `main` plus weekly**; a drift past threshold **files an AUDIT row** as
  well as appearing in the DevLog.
- Measurement rules: `docs/truth-sources.md` → "Measured truth" (every
  claim names the commit it measured; measuring is not tuning).

## Outcome

A committed, commit-stamped table of how the grey deck and the Blood
Price test deck fare in every Act 1 fight at the level the ledger gives
the player there, including the lowest VITAE reached. It refreshes on
every mechanics merge to `main` and every Sunday, `docs/truth-sources.md`
names it as the current measured truth, and a run-to-run drift past
threshold lands in the DevLog and as a `[content]` AUDIT row.

## Acceptance

- **A1** `npm run measured-truth -w axiomancer-mechanics -- --json`
  prints one JSON object with one cell per (Act 1 ledger fight × stat
  spread × deck), each cell carrying `winRate`, `meanRounds`,
  `lowestVitaeFractionMean`, `lowestVitaeFractionP10`,
  `playerHpTakenMean`, `runs`, `seed`; plus a per-deck `deadCardRate`
  and a `deckCards` list.
- **A2** The cell axis is the Act 1 ledger from `Game/act1-progression.ts`
  (`act1FightLedger()` + `walkAct1()`): for each fight, the player is at
  the full-clear level the walk gives at that point, with the three
  `StatSpread` values; the enemy is at the fight's pinned level. The
  early/mid/late stage profiles are not used.
- **A3** The engine sim records the lowest player VITAE fraction per
  combat (`CombatSimStats` gains `lowestVitaeFractionMean` and
  `lowestVitaeFractionP10`), covered by a unit test on a scripted fight
  whose lowest point is known.
- **A4** `scripts/measured-truth.mjs` runs the CLI, appends one line
  `{ date, commit, runs, seed, cells, decks }` to
  `docs/reports/measured/history.jsonl`, and rewrites
  `docs/reports/measured/latest.md` (the human table: one row per fight,
  columns per deck × spread, win rate and lowest-VITAE p10; header
  `measured at <commit>, <date>, <runs> runs, seed <seed>`).
- **A5** `scripts/measured-compare.mjs` is pure (no I/O):
  `compare({ current, previous, thresholds })` returns drifts;
  `renderAuditRow(drift, date)` returns the `[content]` AUDIT block;
  `renderDigestSection(current, previous, drifts)` returns the DevLog
  Markdown. `scripts/measured-compare.test.mjs` covers all three and is in
  the root `npm test` list.
- **A6** `.github/workflows/measured-truth.yml` runs on `push` to `main`
  filtered to `axiomancer-mechanics/src/**`, on Sunday `cron`, and on
  `workflow_dispatch`; joins the `nexus-loop` concurrency group; commits
  `docs/reports/measured/` and `plan/AUDIT.md` to `main`; never fails on
  a number (only on a measurer crash). `scripts/loop-pr.test.mjs` still
  passes (no merge, auto-merge or force-push).
- **A7** Each drift files one `[content]` row in `plan/AUDIT.md` Pending
  (and its issue via `scripts/loop-issue.mjs open`, as `perf-audit.mjs`
  does), naming the fight, deck, metric, previous and current value, and
  both commits. Rows are deduplicated by (fight, deck, metric) against
  open rows.
- **A8** `skills/digest.md` gains a "Measured truth" step: read the last
  two history lines, call `renderDigestSection`, include it in the day's
  DevLog entry; "no run since the last entry" renders one line, not an
  empty table.
- **A9** `docs/truth-sources.md` → "Measured truth" is rewritten: the
  baseline is no longer "none current"; it names
  `docs/reports/measured/latest.md`, the stamp rule (name the commit),
  the cadence, and that it is a measurement, not a gate (D57) and not a
  tuning licence (D37).
- **A10** The first run has been executed by `workflow_dispatch` on the CI
  runner (not from a local machine) and its line is in `history.jsonl`;
  `latest.md` is committed; the DevLog's next entry carries the section.

**Measure:** `npm run verify -w axiomancer-mechanics && npm test` green,
and `node scripts/measured-truth.mjs --dry-run` prints a table with a row
for every Act 1 ledger fight and a win rate for both decks.

## Scope

| File | Workspace | Role |
|---|---|---|
| `axiomancer-mechanics/src/Combat/combat.encounter.sim.ts` | mechanics | Track `lowestVitaeFraction` per run inside the combat loop (min of player HP / max HP after each enemy action); aggregate mean and p10 into `CombatSimStats`. |
| `axiomancer-mechanics/src/Combat/combat.measured-truth.ts` | mechanics | Pure builder: `measuredTruthCells({ runs, seed })` iterates `act1FightLedger()` × `walkAct1()` levels × `StatSpread` × the two decks, calls `simulateHazardPatternCombatDetailed` with the greedy policy, returns the report object of A1. Dead-card rate per deck from `cardUsage`. |
| `axiomancer-mechanics/src/Combat/combat.measured-truth.test.ts` | mechanics | Cell axis = ledger length × 3 × 2; every cell has every A1 key; a 5-run smoke run finishes; A3's lowest-VITAE scripted test. |
| `axiomancer-mechanics/src/CLI/measured-truth.cli.ts` | mechanics | Flags `--runs=N` (default 300), `--seed=N` (default 1), `--json`. Prints the aligned table or, under `--json`, the report and nothing else. UI only. |
| `axiomancer-mechanics/package.json` | mechanics | `"measured-truth": "ts-node src/CLI/measured-truth.cli.ts"`. |
| `scripts/measured-compare.mjs` | root | Pure compare + renderers (A5). |
| `scripts/measured-compare.test.mjs` | root | `node:test` suite; added to the root `npm test` list. |
| `scripts/measured-truth.mjs` | root | Orchestrator (A4, A7). Flags `--dry-run` (print, write nothing), `--no-issues`. |
| `docs/reports/measured/history.jsonl` | root | Append-only run history. |
| `docs/reports/measured/latest.md` | root | The rendered table truth-sources points at. Generated; carries a "generated, do not edit" line. |
| `docs/reports/measured/thresholds.json` | root | `{ winRatePoints: 10, lowestVitaeP10: 0.15, meanRounds: 2 }`. |
| `.github/workflows/measured-truth.yml` | root | A6. Model on `perf-audit.yml` (same checkout, Node setup, commit step and `nexus-loop` group). |
| `package.json` (root) | root | `"measured:truth": "node scripts/measured-truth.mjs"`. |
| `skills/digest.md` | root | A8 step. |
| `docs/truth-sources.md` | root | A9 rewrite of "Measured truth". |
| `plan/revamp/loop.md` | root | One paragraph under R12: "R12a built the engine half; R12 designs the command on top of it." |

Decks measured: `grey` (the three grey cards, `STARTING_CARD_IDS`) and
the Blood Price lane's `testDeck` from the card-lane registry
(`Cards/card.lanes.ts`). Resolve the Blood Price deck through the
registry, never by listing card ids in this phase's code, so a future
deck revision changes nothing here.

## Consumers to update

- `axiomancer-mechanics/src/index.ts`: export `measuredTruthCells` and the
  report type (R12's command will import them).
- `docs/game-model.md`: no rule changes; add one line under the
  progression section pointing at `docs/reports/measured/latest.md` for
  the measured door win rates.
- The catalog/DevLog exporters: untouched. The DevLog section is produced
  by `/digest`, not by `site:build`.

## Save / schema contracts

None. No save data, no migration.

## Carrier sweep

Not an R-phase; no glossary or glyph changes.

## Decisions made upfront — DO NOT ASK

1. **Axis is the Act 1 ledger, not the stage profiles.** R12 names the
   question "does stat growth track the Act 1 curve"; the ledger is that
   curve (R9). Re-pointing `combat.stage-profiles.ts` is R12's design call
   and is not touched here.
2. **One policy: the greedy witness.** Policy roster is R12's call; a
   second policy doubles the run time for a question nobody has asked.
3. **Runs 300, seed 1 in CI.** The `act1-progression` CLI's own default
   scale; roughly 20 fights × 3 spreads × 2 decks × 300 = 36k combats,
   minutes on the runner. If the run exceeds 25 minutes in CI, drop to
   200 and say so in the commit body; never raise the workflow cap past 40.
4. **Lowest VITAE is a fraction of max VITAE**, sampled after every enemy
   action, so a fight the player wins at 1 VITAE reads 0.0x, and p10 is
   the "one in ten fights gets this close" line R12 asked for.
5. **Drift thresholds** (T's "also file an AUDIT row" call): win rate
   moves ≥ 10 points, lowest-VITAE p10 moves ≥ 0.15, or mean rounds moves
   ≥ 2, for the same (fight, deck, spread) between consecutive history
   lines. The first line never drifts (nothing to compare).
6. **The AUDIT category is `content`.** A balance drift is fixed by
   retuning a card, deck or enemy, which `/iterate` may not do (D37,
   D88); a `content` row waits for a brief T approves, so the rows are
   T's queue, not `/iterate`'s. The row text says so.
7. **Cadence** (T's call): `push` to `main` filtered to
   `axiomancer-mechanics/src/**`, plus Sunday 07:37 UTC (after
   `perf-audit` at 07:07, inside the `nexus-loop` group), plus
   `workflow_dispatch`. A plan-only or mobile-only merge does not re-run
   it.
8. **The workflow commits to `main` directly**, like `perf-audit.yml`:
   its output is generated data plus AUDIT rows, which is plan-only under
   D84. The phase's own code lands by `loop:pr` PR.
9. **Nothing gates.** No budget, no exit code on a number, no CI
   freshness warning (that was D57's retired tooling). A crashed measurer
   is the only red run.
10. **This is a measurement, not "the baseline" in D57's sense.** Whether
    it becomes a gated baseline is R12's attended call. `latest.md` and
    truth-sources use the word "measured", not "baseline", in prose.
11. **No card, enemy or deck is changed** to make a number look better,
    whatever the first run shows. A surprising first table is a finding
    for the commit body and the AUDIT row, never a fix.

## Tests matrix

| Suite | Subject |
|---|---|
| `combat.encounter.sim` (existing) + new case | `lowestVitaeFraction*` on a scripted fight with a known trough |
| `combat.measured-truth.test.ts` (new) | cell axis shape, A1 keys, deck resolution via the lane registry, 5-run smoke |
| `scripts/measured-compare.test.mjs` (new, root) | `compare` on no-previous / under / over threshold; `renderAuditRow` shape and dedupe key; `renderDigestSection` with and without drifts and with no new run |
| `scripts/loop-pr.test.mjs` (existing) | the new workflow does not merge, auto-merge or force-push |
| `scripts/check-lexicon` / `check-prose` (existing) | `latest.md`, truth-sources and the digest step pass the lexicon |

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm test
node scripts/measured-truth.mjs --dry-run
```

Mobile is untouched; the `@mechanics` alias couples the packages only
through the public surface, and the new export is additive, so run
`npm run typecheck -w axiomancer-mobile` once to be sure.

## Commit body template

```
loop: phase R12a — measured-truth baseline

Measures the grey deck and the Blood Price test deck across the Act 1
ledger (fight × spread), with lowest VITAE, into
docs/reports/measured/{history.jsonl,latest.md}; refreshes on mechanics
merges and Sundays; drifts past thresholds.json land in the DevLog and as
[content] AUDIT rows. Measurement only (D57), nothing tuned (D37, D88).

Acceptance: A1-A10 (A10 after the first workflow_dispatch run).
Judgment calls: <runs chosen, anything the first table showed>.
```

## DoD

A1–A10 ticked in the PR body (A10 ticks after T merges and the first
dispatch run commits its line).

## Follow-ups (out of scope)

- **R12** designs the `/combat-playtest` command on top of
  `measuredTruthCells` (policies, stage-profile re-point, what a drift
  should trigger beyond an AUDIT row).
- A second deck axis (a future lane's `testDeck`) is one registry entry;
  the CLI should pick up every registered lane automatically once R12
  decides that is wanted.
- Rendering `latest.md` into the DevLog site (`site:build`) if T wants
  the numbers public.
