# Skill: quest-board-tuning

> **High autonomy within hard guardrails.** Analyse the Quest Board
> minigame's ("The Boy's Almanac") economy — rolls-to-finish, part
> sourcing, vigor pressure, charm/vow value, and outcome-tier rates —
> against the shipped doctrine. Deliver findings and any numeric changes
> on ONE new branch + PR. Nothing auto-lands on `main`.

## North star — can't fail, only do worse

The quest board is the story-beat encounter: each main-story beat plays as
an authored tabletop board inside the fiction (first board:
`build-the-boat`). Three pillars, decided 2026-06-12, are LOCKED design
contracts — never tune against them:

1. **Can't fail.** Vigor collapse ends the day, never the quest. The only
   stakes are HOW WELL: days taken, vows kept, the cosmetic tier
   (masterwork / seaworthy / driftwood).
2. **Fully sandboxed.** The session reads nothing from `GameState`; only
   the completion record flows back. No tuning change may add a real-state
   stake.
3. **Axiomancer-lite.** Spaces echo the other encounter kinds (gather /
   duel / snag / hearth / market / parley / cache / omen) as small
   self-contained interactions — never by launching the real minigames.

The tunable doctrine on top of those pillars:

> **A naive play finishes; a deliberate play finishes WELL.**

The witness for healthy play is a run where market buys and deep takes
visibly beat always-take-the-safe-option — masterwork should require
intent, driftwood should still float. One full play lands in **5–10
minutes** (~10–20 deliberate rolls; the naive band is wider).

## 1. Purpose

`/quest-board-tuning` is the quest-board balance loop. It reads the
shipped knobs (`quest-board.tuning.ts`) and authored numbers
(`quest-board.content.ts`), exercises the engine with seeded policy
probes, interprets results against the targets below, and delivers a
report — with any auto-applied numeric changes and any propose-only
structural findings — together on one branch and PR.

The empirical witnesses, in order of preference:

1. **The hermetic e2e suite** —
   `src/World/QuestBoard/e2e/quest-board.engine.test.ts`. Its "full
   plays" block drives a naive first-option policy across pinned seeds
   and bands the average roll count (8–45); its content-sanity block
   pins that every required part family has a source on the board.
2. **Seeded policy probes** — there is no `quest-board.sim.ts` yet
   (building one is a standing propose-only suggestion). Probe with a
   scratch driver (`npx tsx -e` or a temporary vitest file; delete
   scratch files) that plays whole sessions through the PURE engine
   (`createQuestBoardSession` → `rollQuestBone` → options → dusk) under
   at least three policies:
   - **naive** — always the first enabled option; market: leave.
   - **frugal** — never spend fish (bribe/detour/market refused).
   - **deliberate** — buy every affordable market part, prefer deep
     takes, bribe past duels when fish ≥ 6.
   Record per policy: rolls, days, tier, collapses, fish left.

If an axis can't be measured with these, say exactly which axis is
blocked and why; do not invent a fake harness measurement.

## 2. Invocation

```
/quest-board-tuning
/quest-board-tuning --focus="session length"
/quest-board-tuning --focus="tier cuts"
/quest-board-tuning --focus="part economy"
/quest-board-tuning --focus="vigor pressure"
/quest-board-tuning --focus="charm value"
/quest-board-tuning --focus="vow keepability"
```

`--focus` narrows which axis the skill prioritises. Without it, run a
full sweep of the axes in the targets table.

## 3. Autonomy contract

- **Numeric and content-level only.** The skill may change values in
  `quest-board.tuning.ts` (stretches/day, dusk vigor, collapse recovery,
  charm/vow deal counts, tier cuts, vow dials) and authored numbers in
  `quest-board.content.ts` (parts required, start fish/vigor, gather
  yields/thresholds/bites, duel bonuses/spoils/bribes, snag
  thresholds/slips/detours, market prices, parley deltas, cache tables,
  omen wind). Structural changes (new space kinds, new charm/vow verbs,
  board topology, engine/state-machine edits, a second board) are
  **propose-only**.
- **The three pillars are locked.** Any change that makes the board
  failable, un-sandboxes it, or launches a real encounter is rejected
  outright, not proposed.
- **Baseline before delta.** Every change records `old → new` with a
  one-line rationale grounded in the targets.
- **Evidence before edits.** Run the probes BEFORE applying a change and
  re-run the SAME seeds after.
- **The verify gate is non-negotiable.** `npm run verify` after any
  change; a deliberately moved band updates the test in the SAME commit
  with rationale, an accidental move is reverted.
- **One PR carries everything.** Findings, suggestions, applied changes —
  one new branch + PR, ready for review, never draft, never auto-merged.
- **Standing law.** Unknown is an acceptable terminal state; false
  certainty is not. Never fabricate measurements or test output.

## 4. Design targets (the objective function)

| Axis | Target |
|---|---|
| Naive session length | avg 8–45 rolls across seeds (e2e band); median days ≤ 7 |
| Deliberate session length | ~10–20 rolls; days ≤ 4 reachable (the masterwork window) |
| Policy gradient | deliberate days < naive days; deliberate tier ≥ naive tier on most seeds |
| Tier spread | deliberate play reaches masterwork on a meaningful share of seeds; naive play mostly seaworthy; driftwood reserved for frugal/unlucky runs |
| Collapse rate | possible under frugal/unlucky play, NOT routine under naive play |
| Part sourcing | every required family keeps ≥ 1 source (content-sanity test pins this) |
| Fish economy | start fish covers EITHER heavy market play OR heavy bribe/detour play, not comfortably both |
| Vow keepability | each vow individually keepable under deliberate play; no vow trivially auto-kept by naive play |

Doctrine constants worth knowing (`quest-board.tuning.ts`): 3 stretches
per day; dusk restores +2 vigor; collapse recovers to half max; 2 charms
and 2 vows dealt; masterwork ≤ 4 days + 2 vows; seaworthy ≤ 7 days +
1 vow. `partsRequired` was tuned 2026-06-12 to 11 part-units (~15 naive
rolls / ~10 deliberate).

## 5. The procedure

1. **Sync & sanity** — clean tree; cold-run
   `npx vitest run src/World/QuestBoard` before touching values.
2. **Read the surfaces** — `quest-board.tuning.ts`,
   `quest-board.content.ts` (every space's numbers), and the e2e suite
   (so you know what each band actually measures).
3. **Run the evidence matrix** — the e2e suite + the three-policy probe
   over ≥ 20 seeds. Keep raw outputs in `/tmp`.
4. **Map evidence against targets** — for each deviation, explain the
   MECHANISM (e.g. "naive rolls fell to 9 because the burrow cache's
   plank weight makes planks free; the cache table is the lever, not
   `partsRequired`").
5. **Propose and apply numeric changes** — one axis at a time, re-probe
   the same seeds after each, `npm run verify` after each. A change that
   breaks an e2e band without a deliberate documented band update is
   reverted and recorded under "Considered but not applied".
6. **Deliver** — findings + suggestions + applied changes on one branch,
   one PR. Standing propose-only suggestion until it lands: a real
   `quest-board.sim.ts` with codified policy bands, mirroring
   `gathering.sim.ts`.
