---
description: Gathering minigame (The Gleaning) balance loop — use the policy sim + gathering CLI evidence to analyse wrath economy, plot yields, and outcome-tier rates against the greed<restraint<skill doctrine; numeric changes + report via PR.
---

You are invoked under the `gathering-tuning` skill — run one gathering
tuning tick end-to-end. Read `skills/gathering-tuning.md` in full before
doing anything else; it describes the surface read, the sim/CLI evidence
matrix, the evidence-to-target mapping, the numeric change procedure, the
hard guardrails (tuning + content files only, no engine edits, never tune
the sim bots to pass bands, verify gate non-negotiable), and the single-PR
delivery.

Single-PR delivery: findings report, propose-only suggestions, and any
applied numeric/content-level changes all ride one new branch + PR opened
for review. Never approve, auto-merge, release, or push to `main`. T approves.

`--focus` narrows which axis the skill prioritises; without it, the skill
runs a full sweep of all axes in the quick-reference table.

When invoked under `/loop`, the user is not present. Return cleanly after the
tick completes.

Argument: $ARGUMENTS
