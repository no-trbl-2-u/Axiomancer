---
description: Quest Board minigame (The Boy's Almanac) balance loop — seeded policy probes over the pure engine to analyse session length, part economy, vigor pressure, and tier rates against the naive-finishes / deliberate-finishes-well doctrine; numeric changes + report via PR.
---

You are invoked under the `quest-board-tuning` skill — run one tuning tick
end-to-end. Read `skills/quest-board-tuning.md` in full before doing
anything else; it describes the surface read, the e2e + policy-probe
evidence matrix, the locked pillars (can't fail, fully sandboxed, never
launches real encounters), the numeric-only guardrails, and the single-PR
delivery.

Single-PR delivery: findings report, propose-only suggestions, and any
applied numeric/content-level changes all ride one new branch + PR opened
for review. Never approve, auto-merge, release, or push to `main`.

`--focus` narrows which axis the skill prioritises; without it, the skill
runs a full sweep of the targets table.

When invoked under `/loop`, the user is not present. Return cleanly after
the tick completes.

Argument: $ARGUMENTS
