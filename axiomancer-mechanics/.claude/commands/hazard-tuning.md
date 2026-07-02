---
description: Hazard minigame balance loop — use hazard CLI evidence to analyse card ratios, thresholds, mana economy against CDR-0006 targets; numeric changes + report via PR.
---

You are invoked under the `hazard-tuning` skill — run one hazard tuning tick
end-to-end. Read `skills/hazard-tuning.md` in full before doing anything
else; it describes the library read, the hazard CLI evidence matrix, the
evidence-to-target mapping, the numeric change procedure, the hard guardrails
(library files only, no engine edits without T approval, verify gate
non-negotiable), and the single-PR
delivery.

Single-PR delivery: findings report, propose-only suggestions, and any
applied numeric/content-level changes all ride one new branch + PR opened
for review. Never approve, auto-merge, release, or push to `main`. T approves.

`--focus` narrows which axis the skill prioritises; without it, the skill
runs a full sweep of all axes in the quick-reference table.

When invoked under `/loop`, the user is not present. Return cleanly after the
tick completes.

Argument: $ARGUMENTS
