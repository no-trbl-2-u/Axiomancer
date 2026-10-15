# Phase B3 — The hazard as a fixed puzzle: engine, solver, outcome, stat unlocks and three demos

## Sources

- The `/plot` request from T, 2026-10-15 (attended): "Each hazard is a set puzzle. Easy = many solutions, hard = one
  solution and just barely meets the goal. We need a timer. Rewards should NOT give hazard card rewards."
  Every ruling from that session is recorded in `braindump/2026-10-15-hazard-fixed-puzzle.md` (added by this PR);
  that file is the design record and binds this brief.
- `plan/revamp/hazards.md` § B3 ("Hazard mechanics redesign (owner)"). This brief is B3's brief. It replaces the
  blocked owner-led row `Phase B3` with the rows below, because T designed it in this session.
- D52 (hazards reset; T redesigns the mechanics in B3), D88 and D37 (content per surface; no card or keyword is
  created), D57 and the "No governing objective function" standing decision (see Decisions: the band check is on
  authored puzzle content, ruled by T), D84 and D93 (code lands by `loop:pr`, this plot by a `plot` PR).
- Evidence: a scratchpad solver drove the real `hazard.engine.ts` transitions over fixed layouts. On one round the
  goal alone sets the band, for example one safe layout gave goal 14 → 222 distinct winning outcomes,
  26 → 13, 30 → 2, 32 → 0. The table is in the braindump file.

## Outcome

A hazard can be played as a fixed, one-round puzzle: an authored layout of cards, dice, predetermined DRAW
cards and stat unlocks, under a clock. A solver proves each layout is solvable and in its declared band, and
three demo puzzles are playable from the dev menu. Act 1's live hazards are unchanged until T approves the demos.

## Acceptance

- **A1** A layout type `HazardPuzzleLayout` exists in `axiomancer-mechanics/src/World/Hazard/puzzle/`, with:
  - id and title;
  - the hand (card ids, in order);
  - the reserve (predetermined DRAW cards, in order);
  - the dice faces;
  - one goal per route (safe: combined number; risk: `[force, escape]`);
  - its declared band per route (`easy | medium | hard`);
  - its stat unlocks (A9).
- **A2** A puzzle session runs on the existing card and die rules (stage, power, apply, discard and salvage,
  `dieCanPower`, convert), for exactly one round, and never reads an RNG. The same layout and the same moves
  always give the same state; a test replays one move list twice and compares the states.
- **A3** A DRAW card in a puzzle draws the next cards of the layout's reserve, in order, at today's amounts
  (`drawBase` / `drawPowered`). Its test plays a layout whose only solution draws a reserve card.
- **A4** A layout holding a RE-CAST card (`effect: 'recast'`) is rejected by `validateHazardPuzzleLayout` with
  a reason. RE-CAST cards stay in `HAZARD_DECK` for the live minigame (see Decisions).
- **A5** `confirmHazardPuzzle` (the player's confirm, or the clock running out) resolves the round once and
  returns `{ force, escape, goal, p, cleared }`, where p is the value reached divided by the goal (the weaker
  meter on risk), clamped to [0, 1].
- **A6** `solveHazardPuzzle(layout, route, unlocks)` drives the A2 transitions and returns:
  - the number of distinct winning outcomes (different end states; the order of moves is not counted);
  - the best surplus over the goal;
  - one winning move list.

  Unit tests use small hand-built layouts whose counts are worked out by hand in the test file.
- **A7** A library test checks every layout in `HAZARD_PUZZLE_LIBRARY`, on both routes, with no unlocks:
  - it is solvable;
  - its count sits in its declared band (A8);
  - the solver's winning move list replays to a cleared resolve through the session functions.
- **A8** The bands are constants in `hazard-puzzle.tuning.ts`:
  - easy: 30 or more winning outcomes;
  - medium: 5 to 29;
  - hard: 1 to 4, with best surplus ≤ 1.
- **A9** Stat unlocks are optional thresholds a layout may declare. Each is `{ stat: 'heart' | 'body' | 'mind',
  min: number }` plus one of:
  - `extraDie`: +1 die of the stat's colour (Body → red, Mind → blue, Heart → purple; never gold);
  - `extraCard`: a named card joins the hand;
  - `blankReroll`: each blank (✕) die turns to a face the layout names.

  They are applied once, at session start, from the player's `baseStats` (`Character/index.ts`).
- **A10** The library test also proves that for every subset of a layout's unlocks, the puzzle stays solvable
  and its winning-outcome count is at least the no-unlock count, so an unlock never makes a puzzle harder.
- **A11** `hazardPuzzleOutcome(ctx)` is one pure function, taking a context object so new inputs can be added
  without changing its callers:
  - **Always pays** (`HAZARD_PUZZLE_REWARDS`): XP, one modest consumable roll (`rollCacheReward`, tier
    `modest`) and one material from the hazard's region gathering list.
  - **Full completion** (p = 1) adds a bonus: the route's shillings purse, 12 safe or 32 risk, today's
    `HAZARD_TUNING.rewards`.
  - **Failure** (p < 1) loses round(max × (1 − p)) VITAE, with max = 6 safe and 12 risk.
  - **Scar:** the −5 max VITAE scar (`HAZARD_MAXHP_SCAR`) applies only when p < 0.5.
  - **Tuning:** every number lives in `hazard-puzzle.tuning.ts`.
- **A12** The outcome is applied through the existing paths:
  - XP through the game reducer's XP grant, so level-ups fire;
  - items through `Items/item-grant.ts`;
  - the scar through `HAZARD_SCAR_FLAG_PREFIX`, so an inn rest mends it.

  An engine e2e test claims a failed and a cleared demo and checks the player state.
- **A13** Three demo layouts ship in `HAZARD_PUZZLE_LIBRARY`, one per band on the risk route (the safe route of
  each sits in the same band or easier). Each:
  - was authored backward: the intended line first, then the goal set to what that line reaches;
  - uses only existing hazard cards, minus RE-CAST;
  - declares at least one stat unlock.

  At least one demo's every solution needs a reserve DRAW card. Their themes reuse the existing hazards' copy
  (title, scenario, route names); no new story text is written.
- **A14** The dev menu's MINIGAMES & REWARDS section opens a "HAZARD PUZZLES" list of the three demos and a
  demo board. The board shows:
  - the hand, dice and reserve count;
  - both routes, picked before the clock starts;
  - a stat-unlock line naming what the player's stats unlocked;
  - the clock;
  - a confirm button;
  - an outcome panel listing the rewards and the penalty.

  Board logic lives in a presenter (`state/presenters/`), not in components.
- **A15** The clock is a per-band constant (`HAZARD_PUZZLE_CLOCK_SECONDS`, placeholder easy 90 / medium 75 /
  hard 60). Expiry calls `confirmHazardPuzzle` with the board as it stands. A mobile test fakes the timer and
  checks expiry.
- **A16** Act 1 is unchanged: the six live hazards still run today's three-round minigame, and no save field
  changes. The existing `hazard.engine.test.ts` and `hazard.balance.sim.test.ts` pass untouched.
- **A17** (attended) `docs/reports/hazard-puzzle-timing.md` records timed first-time solves of the three demos:
  - who solved (the `playtester` agent, and T), the clock hidden;
  - per demo: the median solve time and the success rate;
  - the clocks that result (median × 1.5, rounded to 5 s), written into the A15 constants;
  - T's verdict, "lock the process" or "change X", in T's words.

Measure: `npm run verify -w axiomancer-mechanics && npm run verify -w axiomancer-mobile` pass; the A7/A10 library
test reports each demo's band, count and unlock subsets; the dev menu opens all three demos and finishes each one
on web (`npm run verify:visual` shot of the board and the outcome panel).

## Scope (shared)

- `axiomancer-mechanics/src/World/Hazard/puzzle/` (new): types, session, solver, outcome, tuning, the demo library,
  and their tests. It imports the card definitions and the die rules from the existing hazard modules; it
  doesn't fork them.
- `axiomancer-mechanics/src/index.ts`: additive exports only.
- `axiomancer-mobile`: a puzzle presenter and store actions, a demo board screen or overlay, the dev-menu entry.
  The live hazard route, `components/hazard/*` and `state/hazard/store-actions.ts` are not changed beyond what
  sharing a card or die component needs.
- Not touched: `HAZARD_DECK` and `HAZARD_LIBRARY` content, the live three-round engine, the map, the saved hazard
  deck, card or keyword definitions (D37).

## Consumers to update

- `docs/game-model.md`: one paragraph on the demo puzzle mode, saying it is dev-menu only.
- `axiomancer-mechanics/src/World/Hazard/index.ts` and the package barrel: the new exports.
- The dev menu's MINIGAMES & REWARDS hint text.

## Save / schema contracts

None. A puzzle session is not saved, the same as today's mid-hazard state on a dev entry. Its outcome writes only
fields that already exist: XP, inventory, the scar flag and VITAE. No migration.

## Decisions made upfront — DO NOT ASK

- **One round, no deck, no roll** (T). The puzzle never calls `seedRng`. Blank (✕) faces are authored, not
  rolled.
- **RE-CAST is excluded from puzzles, not deleted.** T ruled to cut RE-CAST cards, the saved hazard deck and its
  screens, and the `deadcard` consequence. The live Act 1 hazards still use all of them, so the cuts land with the
  Act 1 rollout (Follow-ups), once T approves the demos (T: "Not until we lock in on the process").
  [T to confirm]
- **DRAW keeps its card text and amounts** and draws from the layout's reserve (T).
- **"Distinct winning outcome"** = a distinct end state of a cleared resolve:
  - the multiset of staged cards with their powered flag;
  - the hand left;
  - the reserve left;
  - the available dice;
  - the salvage progress.

  Holding versus playing a card that adds nothing counts once. This is what the evidence table counted.
- **Bands are enforced on authored puzzles (T, solver test "Solvable + band").** This is a ruling on the
  "no count pin" doctrine (`axiomancer-mechanics/CLAUDE.md`): the band is a property of authored puzzle content,
  which T chose to enforce. It is not a balance target for combat or the run.
- **Solver budget:** a round whose plan space passes `HAZARD_PUZZLE_SOLVER_BUDGET` (start 20,000 plans) fails
  the library test with "too open to count". Shrink the layout; don't raise the budget silently.
- **Stat → colour:** Body → red, Mind → blue, Heart → purple (T). Unlocks are read once at session start.
- **Failure formula** as in A11 (T: "we can experiment with this and I'd actually like this to be dynamic based
  on other things"). It takes a context object so later inputs (region, level, scars already banked) are
  additive.
- **XP amount:** `HAZARD_PUZZLE_REWARDS.xp` = 10 × player level on any resolve, +50% on full completion.
  T asked for "a little experience". [T to confirm]
- **Material source:** the region's gathering materials already in `World/MapEvents/content.ts`; no new material
  is authored. A region with none gives no material.
- **Demos are content the loop authors** under D88, because T approved this plot. They use existing cards only
  (D37 holds) and reuse existing hazard copy (no new canon, Story canon rule).
- **Clock placeholders** (A15) are not tuned; A17 sets them from measured solves.
- **Slot:** anytime. It blocks no open row and fixes no live defect.

## Tests matrix (shared intent; each phase lists its own)

- Mechanics: puzzle session determinism and the one-round resolve; DRAW from the reserve; RE-CAST rejection;
  solver counts on hand-built layouts; the library band test; unlock subsets; the outcome function's formula
  cases (p = 0, 0.49, 0.5, 0.99, 1 on both routes); an e2e claim test of state changes.
- Mobile: presenter tests for the board, the unlock line, the outcome panel and clock expiry with fake timers;
  the dev-menu entry render test.

## Verify gate

`npm run verify -w axiomancer-mechanics`; for B3e also `npm run verify -w axiomancer-mobile` and
`npm run verify:visual` for the board. Mechanics' public surface changes, so B3a–B3d also run the mobile
type-check (bearings: "if a change touches mechanics' public surface, also verify mobile").

## Commit body template

```
<id>: <one line>

Closes A<n>, A<m> of plan/phases/phase_B3_hazard_puzzle.md.
<what changed, one paragraph>
Verify: <commands run, results>
```

## DoD

A1–A17 ticked, each by the phase that closes it.

## Follow-ups (out of scope)

- **Act 1 rollout and the cuts** (a new `/plot` once T approves the demos in B3f):
  - author Act 1's hazard puzzles;
  - route the live hazard nodes to the puzzle;
  - delete the three-round engine paths, RE-CAST cards, the saved hazard deck (`hazard.deck-flags.ts`,
    `app/hazard-deck`, `HazardRemoveGrid`, `DebugHazardDeckRandomize`) and the `deadcard` consequence, with a save
    migration dropping `hazard-card:` flags;
  - retire `PHASE_CANDIDATES` "Hazard deck-thinning remove-card consumer".
- **Stat-threshold values by act and region:** the `min` numbers for real puzzles are set at rollout.
- **A dynamic failure curve** using more inputs (T's wish); A11's context object is the seam.
- **Consumable pool:** only three healing potions exist, and materials appear to have no sink (the Anvil engine
  does not read them). Name this at rollout; it's not this phase's to fix.

## Phases

### B3a — Puzzle layout and one-round session · M · closes A1, A2, A3, A4, A5, A16 · requires nothing
Measure: `npm run verify -w axiomancer-mechanics`; the session tests replay a move list twice to identical state
and resolve a reserve-DRAW layout.
- Scope: `World/Hazard/puzzle/hazard-puzzle.types.ts`, `hazard-puzzle.session.ts`, `hazard-puzzle.validate.ts`,
  a test-only layout fixture; additive barrel exports.
- Consumers: barrel only.
- Save/schema: none.
- Tests: `puzzle/e2e/hazard-puzzle.session.engine.test.ts` (determinism, one-round resolve, p on both routes,
  DRAW from the reserve, RE-CAST rejection); the existing hazard suites run unchanged (A16).
- Verify gate: mechanics verify plus the mobile type-check.

### B3b — The solver and the band check · M · closes A6, A7, A8 · requires B3a
Measure: `npm run verify -w axiomancer-mechanics`; the solver unit tests match the hand-worked counts, and the
library test runs (on a fixture library until B3e adds the demos).
- Scope: `puzzle/hazard-puzzle.solver.ts`, `hazard-puzzle.tuning.ts` (bands, budget), the library test harness.
- Tests: `puzzle/e2e/hazard-puzzle.solver.engine.test.ts` (hand-worked counts, best surplus, move-list replay);
  `puzzle/e2e/hazard-puzzle.library.engine.test.ts`.
- Verify gate: mechanics verify.

### B3c — Outcome: XP, loot, completion bonus and scaled failure · S · closes A11, A12 · requires B3a
Measure: `npm run verify -w axiomancer-mechanics`; the outcome formula cases pass and the e2e claim test shows XP,
items, VITAE and the scar flag changing as specified.
- Scope: `puzzle/hazard-puzzle.outcome.ts`, the rewards and failure constants in the tuning module, and a claim
  helper that goes through the reducer, `item-grant` and the scar flag.
- Tests: `puzzle/e2e/hazard-puzzle.outcome.engine.test.ts`.
- Verify gate: mechanics verify plus the mobile type-check.

### B3d — Stat unlocks · S · closes A9, A10 · requires B3b
Measure: `npm run verify -w axiomancer-mechanics`; the unlock tests show each unlock kind applied from player
stats, and the library test checks every unlock subset.
- Scope: unlock types and application in the session; the subset check in the library test.
- Tests: extend the session and library suites.
- Verify gate: mechanics verify.

### B3e — Three demos and the dev-menu board · L · closes A13, A14, A15 · requires B3b, B3c, B3d
Measure: `npm run verify -w axiomancer-mechanics && npm run verify -w axiomancer-mobile`; the library test
reports the three demos in their bands; a `verify:visual` shot shows a demo board and an outcome panel.
- Scope: `puzzle/hazard-puzzle.library.ts` (three demos, authored backward with the B3b solver), a mobile
  presenter and store actions, the board UI, the dev-menu entry, the clock.
- Consumers: `docs/game-model.md` paragraph; the dev-menu hint.
- Tests: the library test now runs on the demos; the mobile presenter, clock-expiry and dev-entry tests.
- Verify gate: both workspaces plus `verify:visual`.

### B3f — Timed demo solves and the process lock (attended) · S · closes A17 · requires B3e
Measure: `docs/reports/hazard-puzzle-timing.md` exists with a median solve time and success rate per demo, the
resulting clocks are in `HAZARD_PUZZLE_CLOCK_SECONDS`, and T's verdict is quoted.
- Scope: the timing report; the three clock constants.
- Tests: none new; the A15 test's values follow the constants.
- Verify gate: mechanics verify.
