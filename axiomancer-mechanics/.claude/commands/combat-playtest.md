---
description: Supercharged Hazard-Pattern Combat playtest loop — run the stage-profile x policy matrix (npm run combat-playtest) AND spawn playtester sub-agents to play real seeded encounters, then synthesize a doctrine verdict (is status play the fun path at every stage?) into a report PR. Report only; numeric follow-ups go to /combat-tuning or /deck-tuning.
---

You are invoked under the `combat-playtest` skill — run one playtest tick
end-to-end for the **Hazard-Pattern Combat**. Read
`skills/combat-playtest.md` in full before doing anything else; it describes
the two evidence layers (the quantitative stage matrix via
`npm run combat-playtest` across stage profiles x sim policies x policy-pick
decks with `--cards` per-card usage, and the qualitative layer of 2-4
`playtester` sub-agents spawned in parallel who play real seeded encounters
via `npm run combat` and choose their own decks), the synthesis into
`plan/playtest-<ts>.md` with a per-stage doctrine scorecard and verdict, and
the handoff of every numeric follow-up to `/combat-tuning` (engine
constants) or `/deck-tuning` (cards/decks).

North star: the enemy's SOLE bar is HP and status effects are the EFFICIENT
path there — this skill's job is to prove status play is also the FUN path
at every stage (The Shallows, The Long Road, The Deep Wood, The Unprovable).
Low status-effect engagement, quantitative or felt, is a balance failure
even when win rates look healthy. Where the matrix and the playtesters'
hands disagree, the disagreement IS the finding.

This skill ships NO balance changes — report only. Deliver the report on ONE
new branch + PR (`playtest/combat-<ts>`), ready for review. Never push to
`main`. Never auto-merge.

When invoked under `/loop`, the user is not present. Return cleanly after
the tick completes.

Argument: $ARGUMENTS
