# Phase 87 — Early-game encounter smoothing

> Promoted 2026-09-15 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (score 4.0). Brief generated 2026-09-16 by `/ship-a-phase` §9 (audit /
> test-hardening phase — the page-family brief sections don't apply; adapted
> per Phase 81/86's precedent).

## Outcome

The promoted scope asked for two things: (a) gate the fresh-save first
encounter to a one-phase, zero-keyword foe (Brine Hag becomes fight two), and
(b) audit the fishing-village unlock graph so an ordinary encounter/rest node
opens before or beside the Ash Mire (King of Revenge) boss edge. A pre-work
audit of the live source (below) found **both premises already true** — the
Phase 53c/60/61 gauntlet rebuild fixed the underlying map before the two
CRITIQUE findings that drove this phase's promotion were even filed against
it, and two independent 2026-09-10 re-verification passes
(`plan/CRITIQUE.md`, `plan/AUDIT.md`) already closed both rows
`RESOLVED-STALE` — five days before `/oversight` promoted the (by-then-stale)
candidate row as Phase 87 on 2026-09-15.

Per `skills/ship-a-phase.md` §3 ("decide, ship, document" — the bar for
asking is high), this phase ships as an **audit-confirmation + regression-guard
pass**: it converts the two now-true-by-accident invariants into tested
contracts (so a future content or map-authoring pass can't silently
reintroduce either bug) and fixes the one piece of real doc drift the audit
surfaced (`world-tuning.md`'s doctrine table still described a quest-board
node Phase 61 retired). No map topology or encounter-table changes ship —
there is nothing left to fix.

## Why

Two `plan/CRITIQUE.md` [MED] rows proposed this phase (`plan/PHASE_CANDIDATES.md`
score 4.0, pass 12): a 2026-09-04 playtest reading Brine Hag (HIDE + RAVENOUS,
3-phase) as the first map fight, and a 2026-08-29 user session where the Ash
Mire boss (King of Revenge) flattened a level-1 starter deck three steps from
spawn with no ordinary node in between. Both rows are real historical
findings — but the map they describe was rebuilt by Phase 53c/53d/60/61
(column-layered gauntlet, every node's kind + foe explicitly pinned) before
either finding's own re-verification pass ran. `/iterate` closed both
`RESOLVED-STALE` on 2026-09-10; `/march`'s AUDIT pass independently reached
the same conclusion. The `/expand` candidate that became this phase was filed
from the original (pre-resolution) CRITIQUE text and didn't pick up the
staleness before `/oversight` promoted it.

## Audit findings (verified against current source, 2026-09-16)

**(a) — already true.** Brine Hag has zero authored node assignment anywhere
on `fishing-village` (`grep` across `src/World/MapEvents/content.ts` for
`brine-hag`: zero hits). Every fishing-village encounter/boss node carries an
explicit pinned `enemySlug`, so the map's only random-draw path
(`generateEncounter`, `src/World/encounter.ts`) is unreachable for this map —
Brine Hag can never appear here regardless of fight order. Separately, her
*library* defaults (`createEnemy`'s `defaultEnemyKeywords`/`defaultEnemyStages`,
`src/Enemy/index.ts`) don't even produce the HIDE+RAVENOUS/3-phase profile —
elite difficulty with no authored `keywords`/`stages` resolves to `HIDE 2`,
one phase. That profile exists only in a dev-only combat sandbox mock
(`axiomancer-mobile/state/mocks/combat.mock.ts`, whose own doc comment reads
"a real map encounter of hers will NOT show them") — never reachable by a
live player. The three actual first fights a fresh save can meet — Little
Belle (`fv-13`), Foot-Stealer (`fv-15`), Water-Holger (`fv-24`) — are all
`difficulty: 'normal'` with no authored keywords/stages, i.e. already
zero-keyword and single-phase.

**(b) — already true.** The boss (`fv-6`, King of Revenge) sits five columns
past spawn (per `Continents/Coastal-Village/maps.ts`'s column graph), pinned
to `FV_BOSS_LEVEL = 3` (well under his native L6) explicitly so a fresh
player can win. The column immediately before it (column 4: `fv-15`, `fv-5`,
`fv-20`) is reachable from every column-3 node and itself offers both an
ordinary encounter (`fv-15`, Foot-Stealer) and a rest node (`fv-20`) — the
rest guarantee already had a test (`map-traversal.engine.test.ts` "lets every
route rest immediately before the boss"); the matching encounter guarantee
did not.

## Decisions made upfront — DO NOT ASK

- **Ship as audit + regression-guard, not redesign.** Re-deriving a fix for
  an already-fixed problem would be wasted, risky churn against a
  deliberately-tuned gauntlet (Phase 53c/53d/60/61's column law). The
  autonomy contract's "decide, don't ask" applies: this call is documented
  here and in the shipping commit rather than bounced to `/oversight`.
- **New tests, not new topology.** `content.engine.test.ts` gains two tests
  under the fishing-village describe block: one asserting every pre-boss
  encounter foe (`fv-13`, `fv-15`) resolves `difficulty: 'normal'`,
  `keywords: []`, `stages: []`; one walking every fishing-village node
  asserting Brine Hag never appears and no non-boss node ever resolves an
  `elite`-difficulty foe. `map-traversal.engine.test.ts` gains one test
  mirroring the existing pre-boss-rest guarantee for the pre-boss encounter
  (`fv-15`) — every column-3 node must connect to it, same as it must
  connect to `fv-20`.
- **Fix the one real doc-drift the audit found.** `.claude/commands/world-tuning.md`'s
  doctrine table and prose still describe fishing-village as having "exactly
  one quest node" (`fv-15`) — Phase 61 retired the quest-board `MapEventKind`
  entirely and gave `fv-15` back to the encounter roster as Foot-Stealer; no
  map authors the quest kind any more. Corrected to the current, tied-largest
  encounter/interaction/rest spread (matching `content.ts`'s own up-to-date
  header comment, which was never stale).
- **`map-traversal.engine.test.ts`'s existing "measures the quest board..."
  test keeps its assertion** (the `1/3` share-of-routes number for `fv-15` is
  still literally true) but its title/comment is corrected to stop calling
  `fv-15` a quest node.
- **Brine Hag's `mapName: 'fishing-village'` field is left alone.** Both the
  2026-09-10 CRITIQUE re-verification and this audit independently flag that
  she's permanently unreachable on this map and note it may be worth an
  `/adjust-enemies` look — that's a roster-ownership call for that steward,
  not an encounter-pacing question for this phase.

## Surface (no routes — pure test + doc phase)

| File | Change |
|---|---|
| `axiomancer-mechanics/src/World/MapEvents/e2e/content.engine.test.ts` | Add "keeps every pre-boss combat foe non-elite, zero-keyword, and single-phase" + "never assigns Brine Hag (or any elite) to a fishing-village node" tests |
| `axiomancer-mechanics/src/World/e2e/map-traversal.engine.test.ts` | Add pre-boss encounter-reachability test (mirrors the existing rest guarantee); correct the "quest board" test's stale title/comment |
| `.claude/commands/world-tuning.md` | Correct fishing-village doctrine text (2 spots: North star prose, design-targets table + doctrine-constants line) — quest-board kind was retired Phase 61 |
| `plan/steps/01_build_plan.md` | Phase 87 row ticked `[x]` with commit hash |

## Verify gate

`npm run verify` (mechanics workspace scope) — pure test additions against
already-passing source; no production code changes, so no existing test
should move.

## DoD

- [ ] Two new `content.engine.test.ts` tests added and green.
- [ ] One new `map-traversal.engine.test.ts` test added and green; the
      "quest board" test's title/comment corrected.
- [ ] `world-tuning.md` doctrine text corrected in both spots.
- [ ] `npm run verify` green.
- [ ] Build-plan row ticked.

## Follow-ups (out of scope)

- Whether Brine Hag's `mapName` should move off `fishing-village` given she's
  permanently unreachable there — `/adjust-enemies` territory, flagged twice
  now (2026-09-10 CRITIQUE re-verification, this phase) but not acted on by
  either.
- No further early-game pacing work is queued; re-open via a fresh
  `/critique` or `/expand` pass if a NEW playtest surfaces a different early
  difficulty spike.
