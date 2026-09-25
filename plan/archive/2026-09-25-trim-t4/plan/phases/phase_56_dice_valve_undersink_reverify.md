# Phase 56 — The Dice Valves Under-Sink: Re-Verify Against the Shipped State

**Goal:** T ruled 2026-08-15 (`plan/PHASE_CANDIDATES.md` "Starter Press-Fate
affordance + dice-valve promotion + flag re-test", superseding block) that
the post-D8 under-sink read demanded **both** levers: (1) grant
`sig-press-the-point` on starter loadouts, and (2) promote a dice-valve
reroll card into the preset recipe. This brief documents what shipping this
phase actually required: **verification, not new code** — both levers were
already live, via commits that predate the ruling and the row itself.

## Investigation (why this isn't a build phase)

The row's own evidence chain (digest 2026-07-30 through 2026-08-07 nightlies
reading mid-0.0 / late-0 win rate, "Press Fate fires 0.000×/round") predates
two later commits that resolve exactly the mechanism it names:

**Lever 1 — starter Press Fate grant — already shipped:**
- `fbf3d52c` (2026-07-10, phase 19) — signatures come from WORN EQUIPMENT,
  not from deck/loadout composition. `getSignaturesForLoadout` reads
  `player.equipment`, not `player.knownCards`.
- `7f989382` (2026-07-18, same day as the D7 ratification the row cites) —
  "Press Fate rides every starter loadout: Gambler's Knot default-worn,
  Venom Sigil benched." `relic.library.ts`'s `relic-press-the-point` is
  `defaultWorn: true`; every fresh character (`characters.mock.ts`:
  `seedStartingRelics: true`) starts combat with `sig-press-the-point`
  available.
- The row's "isn't equipped on starter loadouts" framing conflated deck
  composition (cards) with equipment composition (relics/signatures) — a
  distinction that predates the row itself but wasn't cross-checked when it
  was filed.

**Lever 2 — dice-valve card in the preset recipe — already shipped:**
- `84ef85bd` (2026-08-08, PR #182, THE PROFANE CANON rework) authored three
  "Reliquary Dice" valve cards — `knucklebone-recant` (body),
  `ossuary-drawer` (mind), `saints-finger-bone` (heart), each tagged
  `['dice', 'valve']` — and wired `PRESET_DICE_VALVES` in
  `combat.starter-deck-presets.ts`: under Upgradeable Dice, each of the
  three campaign-arc presets (threadbare/pilgrim/apostate) swaps one
  same-aspect card for its stage's valve (`buildUpgradeableDicePresetDeck`,
  fails loudly on any color-law or sizing violation).
- This is the direct architectural descendant of D8's ten-preset valve
  seats (`10ec4fe8`, 2026-07-18) migrated onto the Profane Canon's
  three-preset campaign-arc structure the same day the rework landed —
  before this row (2026-08-15) was even written.

**The re-test the row asks for is already pinned in-suite:**
`combat-dice-economy.sim.test.ts` §"spec 33 D7" carries the exact two
flag-not-ready canaries the row describes, and its own comments record both
flips: F3 (`pressFatePerRound === 0`) DRAINED 2026-07-18 (now asserts
`> 0`), and the STAKE-gap canary is re-measured at +11.5% (was +13.6%). Both
tests are live (not skipped) and green at HEAD (`npx vitest run
src/Combat/e2e/combat-dice-economy.sim.test.ts` — 17 passed / 1 skipped,
the skip being the unrelated #183 balance-band suspension, not the F3/STAKE
canaries).

**Doctrine note, for honesty:** the row's underlying alarm ("mid near-total
collapse, late dead flat") was read against the win-rate doctrine curve.
Phase 43 (`46b5a5df`, 2026-08-08 — the SAME day as the Profane Canon
rework) retired win rate as a grading term outright in favor of the Combat
Quality Index (`combat.objective.ts`): "a 0%-win cell scoring well is
pinned as correct." Re-running the current matrix
(`combat-playtest --deck=preset:all --stage=all --runs=60 --seed=1`)
confirms CQI reads healthy and roughly flat across the campaign arc — early
79-80%, mid 78-80%, late 78-80% — despite mid/late win rates near 0%, which
is the CQI doctrine working as designed, not a collapse. T's 2026-08-15
ruling predates neither Phase 43's landing nor this evidence, but the
ruling text itself cites only the retired win-rate nightlies; this brief
records the fuller current picture rather than silently re-asserting a
superseded doctrine as the reason to act.

## Current re-run (D7 gates, live at HEAD)

`npm run combat-dice-economy -- --seeds=1,2,3,4,5` (greedy policy, flag-on):

- realized ◆ income/round: 1.065 (design band 1.2-1.6 — MISS, tracked
  separately by issue #183, the Profane-Canon balance-band re-arm; NOT this
  phase's scope)
- **Press Fate casts/round: 0.050** (sink active; up from the row's cited
  0.000)
- STAKE-retirement gap: flag-on 4.489 rounds vs flag-off 4.111 (+9.2%, in
  the same reduced-but-not-closed range the in-suite comment records)

`npm run combat-playtest --deck=preset:all --stage=all --runs=60 --seed=1`:

- CQI by stage: early 80%, mid 79%, late 79%, impossible 79% — flat, no
  collapse under the doctrine that actually grades combat today.
- Win rate by stage (for the historical record only, not graded):
  early 73%, mid 6%, late 0% — this is the number the row's alarm was
  reading, and it is unchanged by either lever because both were already
  live before this re-run.

## Decisions made upfront — DO NOT ASK

- **No source changes ship in this phase.** Both levers the row asks for
  are architecturally present and evidenced above; writing a second,
  redundant implementation (e.g., re-authoring a "starter Press Fate
  grant" or a second dice-valve promotion) would either no-op against the
  existing relic/valve-seat mechanism or violate the color/size laws those
  mechanisms already enforce (`buildUpgradeableDicePresetDeck` throws
  loudly on a duplicate valve).
- **Press Fate's low utilization (0.050-0.060 casts/round against a
  ~4.5-round average fight) is a real, current, separately-tunable
  finding** (cost 4◆ vs ~1.0-1.4◆/round income), but tuning that cost is
  balance-numbers work squarely inside `/deck-tuning`'s remit and issue
  #183's "re-arm the suspended balance bands" scope — not this
  verification phase. Left as a follow-up, not silently dropped.
- **The row's attribution caveat** ("measure them separately... so a curve
  move can be traced to a lever") cannot be honored retroactively — both
  levers shipped in the same combined state the row was filed against.
  Recorded honestly rather than fabricating an isolated A/B that never
  happened.

## Verify gate

```bash
npx vitest run axiomancer-mechanics/src/Combat/e2e/combat-dice-economy.sim.test.ts
npx vitest run axiomancer-mechanics/src/Combat/e2e/deck-presets.engine.test.ts
npm run combat-dice-economy --workspace axiomancer-mechanics -- --seeds=1,2,3,4,5
npm run combat-playtest --workspace axiomancer-mechanics -- --deck=preset:all --stage=all --runs=60 --seed=1
npm run deploy:check
```

## Definition of done

- [x] Confirm `sig-press-the-point` is granted on every starter loadout
      (via default-worn relic, Phase 19 + `7f989382`) — already true.
- [x] Confirm a dice-valve reroll card is promoted into the preset recipe
      (via `PRESET_DICE_VALVES`, `84ef85bd`) — already true.
- [x] Re-run the D7 curve/economy witnesses — done above; F3 and STAKE-gap
      canaries green in-suite; CQI matrix re-run fresh.
- [x] Attribution caveat honestly recorded as unsatisfiable in retrospect.
- [x] No flag flip hidden inside this phase (flag was already flipped by
      D-FLIP, 2026-07-18; untouched here).

## Follow-ups (out of scope)

- Issue #183 — re-arm the Profane-Canon balance bands (income floor,
  win/engagement bands) via `/deck-tuning`. Press Fate's low utilization
  belongs inside that pass, not this one.
- `skills/digest.md` §3b still reads baseline health against the retired
  win-rate doctrine curve (`plan/AUDIT.md` docs row, filed 2026-08-09,
  still open) — same drift this brief had to route around; not this
  phase's file ownership.
