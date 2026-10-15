# Phase LV1 — The level curve: level 20 by the end of Act 1, slowing after

## Sources

- The `/plot` request from T, 2026-10-15 (attended): "lower the experience amount a player would need to level up
  … not linear … leveling up early and often, but maybe when they hit around level 20 or so it'll start to slow
  down … about 50 by the time they reach the middle of ACT 3 and maybe level 20 by the time they start ACT 2".
  T answered the design calls by ballot in the same session; see Decisions.
- D55 (XP and levels retuned after the resets; R9 sized Act 1 at 3–4 level-ups). This phase supersedes D55's
  size: T now wants about 19 level-ups across Act 1.
- D38 (the stat-to-quantity mapping is T's call; T made it here: 1 stat point per level).
- D57 and `docs/truth-sources.md` § Measured truth: `docs/reports/measured/latest.md` is regenerated, never
  gated.
- Today's rules: `docs/game-model.md` § VITAE and stats → Levels; `Character/experience.ts`
  (`experienceForLevel`, `EXPERIENCE_STEP` = 250); `Game/game-mechanics.constants.ts` (`STAT_POINTS_PER_LEVEL`
  = 3); `Game/game.reducer.ts` `applyLevelUps` (refills VITAE); `Game/act1-progression.ts` and its test.
- Evidence: the Act 1 ledger at 44719db is 26 fights, all at pinned enemy levels, paying 3,640 XP in total
  (Float-Eye 20 × level, Brine Hag 50 × level, the Doorwarden 200 × level). It doesn't depend on the player's
  level, so the curve alone sets where a full clear ends.

## Outcome

A full Act 1 clear takes a fresh player from level 1 to level 20. Each level costs 10% more than the last
through level 20, then 15% more through level 40, then 20% more. A level gives 1 stat point and no longer
refills VITAE. Existing saves keep their level.

## Size

Size: M

## Acceptance

- **A1** The XP to go from level L to L + 1 is one function, `experienceToNext(L)`, in `Character/experience.ts`:
  - L = 1: `EXPERIENCE_BASE` = 70;
  - each step after costs the previous one × `EXPERIENCE_GROWTH`, applied to the previous step's exact
    (unrounded) value: 1.10 for steps up to the one that reaches level 20, 1.15 up to level 40, and 1.20 after
    that;
  - each step is rounded to the nearest whole XP.

  `experienceForLevel(L)` stays the running total (the sum of the steps below L), so every caller keeps working.
  The bands live as one constant table in `game-mechanics.constants.ts`, replacing `EXPERIENCE_STEP`.
- **A2** `experience.test.ts` pins the table:

  | Reach level | Step cost (XP) | Running total (XP) |
  |---|---|---|
  | 2 | 70 | 70 |
  | 5 | 93 | 325 |
  | 10 | 150 | 950 |
  | 20 | 389 | 3,582 |
  | 21 | 428 | 4,010 |
  | 40 | 6,093 | 47,440 |
  | 50 | 36,153 | 229,326 |

  The test also checks that every step costs more than the one before it.
- **A3** `act1-progression.test.ts` is updated to the new walk: a full clear ends at level 20, and the player meets
  the four doors at levels 4, 9, 14 and 18. `npm run act1-progression` prints that walk.
- **A4** `STAT_POINTS_PER_LEVEL` = 1. `act1-progression.ts`'s `stageStats` and the measured-truth stages follow it
  without code changes beyond the constant.
- **A5** `applyLevelUps` no longer refills VITAE:
  - `health` keeps its value;
  - `maxHealth` is recomputed as today and `health` is clamped to it.

  `levelup-unlocks.engine.test.ts` (or a new reducer test) covers one fight granting three level-ups at once:
  three levels, three banked points, `health` unchanged.
- **A6** A save migration v36 → v37 in `Game/game.migrate.ts` keeps each player's `level` and banked stat points.
  It sets `experience` to the new running total for that level plus the same fraction of the way to the next
  level as before (the precedent is `migrateV35ToV36`), and sets `experienceToNextLevel` from the new curve.
  A migration test covers a level-1 save, a level-3 save half-way to 4, and a save with unspent points.
- **A7** The mobile level-up surfaces (`components/levelup/LevelUpModal.tsx`, `LevelReadyStrip.tsx`,
  `AscendStrip.tsx`) handle several level-ups from one fight. One modal or strip names the levels gained and
  the points banked; the player doesn't click through one modal per level. A presenter or component test covers
  a three-level grant. No copy says or implies that a level-up heals.
- **A8** `docs/game-model.md` § Levels states:
  - the new curve (base 70, growth 10% / 15% / 20%, with the band edges);
  - 1 stat point per level;
  - no refill on level-up;
  - "a full Act 1 clear ends at level 20";
  - the cost to reach level 50 as a projection.

  `docs/reports/measured/latest.md` is regenerated at this phase's commit.

Measure: `npm run verify -w axiomancer-mechanics && npm run verify -w axiomancer-mobile` pass;
`npm run act1-progression` prints a full clear ending at level 20 with doors at 4, 9, 14 and 18.

## Scope

- `axiomancer-mechanics`: `Character/experience.ts` and its test; `Game/game-mechanics.constants.ts`;
  `Game/game.reducer.ts` (`applyLevelUps`); `Game/game.migrate.ts` (v37) and its test;
  `Game/act1-progression.test.ts`; any test that pins an old threshold (`character.engine.test.ts` and others
  found by grep for `EXPERIENCE_STEP` and the old totals).
- `axiomancer-mobile`: the level-up surfaces in A7 and their tests; `components/DebugXpGrant.tsx` if it assumes
  the old step.
- Docs: `docs/game-model.md`; the regenerated measured-truth report.
- Not touched: enemy levels, door pins, `DEFAULT_XP_BY_DIFFICULTY`, enemy VITAE, cards, keywords, art (D37).

## Consumers to update

- Every importer of `EXPERIENCE_STEP` (the migration helpers keep a frozen copy of the old value, as
  `V35_EXPERIENCE_PER_LEVEL` does, so old migrations still compute the same way).
- The package barrel, if it exports `EXPERIENCE_STEP` (replace it with the new constants; mobile follows).

## Save / schema contracts

Save version 36 → 37 (A6). The shape is unchanged; only `experience` and `experienceToNextLevel` values move.
`migrateV35ToV36` keeps working on its own frozen constants.

## Decisions made upfront — DO NOT ASK

- **Curve shape** (T): +10% per level for the first 20 levels, +15% for the next 20, +20% after 40.
  Read as: the step that reaches level L + 1 is the previous step × 1.10 while L + 1 ≤ 20, × 1.15 while
  L + 1 ≤ 40, and × 1.20 after. The A2 table is computed that way.
- **Base 70.** Every base from 64 to 71 ends a full clear at level 20 (computed over the 26-fight ledger); 70 is
  the round number in that range and meets the doors at 4, 9, 14 and 18.
- **Level 50 by mid-Act 3 is a projection, not a test.** Acts 2 and 3 do not exist (D53). The curve puts level
  50 at 229,326 total XP, about 63 times Act 1's income. Acts 2 and 3's enemy XP is sized against this table when
  they are built.
- **Enemy levels and door pins stay** (T: "Keep today's pins. I want to do an ACT 1 enemy creation/retune phase
  soon"). The Doorwarden, pinned at levels 1–4, now meets a level-4 to level-18 player. Fights get easier in
  number until that retune; `docs/reports/measured/latest.md` shows by how much.
- **1 stat point per level** (T). A level-20 player has 19 points, against today's 12 at level 5.
- **No VITAE refill on level-up** (T: "No refill on level-up"). Healing comes from rest and items.
- **Saves keep their level** (T). Points already banked or spent at 3 per level are kept, not clawed back.
- **Hazard XP** (B3c, 10 × level per resolve) is extra income on top of the fight ledger. A3 walks fights only,
  so a player who also clears hazards ends Act 1 a level or so higher. That is accepted.
- **Slot: asap.** T's hazard XP (B3) and the coming Act 1 enemy retune both build on this curve.

## Tests matrix

- `Character/experience.test.ts`: rewritten for A1 and A2.
- `Game/act1-progression.test.ts`: the A3 walk.
- `Game/e2e/levelup-unlocks.engine.test.ts` or a reducer test: A5.
- `Game/game.migrate` tests: A6.
- Mobile: a level-up presenter or component test for a three-level grant (A7).
- `Combat/combat.measured-truth.test.ts` keeps passing; the report is regenerated (A8).

## Verify gate

`npm run verify -w axiomancer-mechanics && npm run verify -w axiomancer-mobile`; then
`node scripts/measured-truth.mjs` to regenerate the report.

## Commit body template

```
LV1: level curve to 20 by end of Act 1

Closes A1-A8 of plan/phases/phase_LV1_level_curve.md.
<what changed>
Verify: <commands, results>
```

## DoD

A1–A8 ticked.

## Follow-ups (out of scope)

- **The Act 1 enemy creation and retune phase** (T: "soon"): re-pin enemy levels to the 1–20 range, then
  re-measure. T will `/plot` it.
- **Act 2 and Act 3 XP sizing** against the A2 table, when those acts exist.
- **Whether a level-up should heal partly** (for example, the max VITAE it adds), if play shows the no-refill
  rule too harsh.
