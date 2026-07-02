---
description: LEGACY turn-based combat balance loop (resolveCombatRound) — run the character × playstyle × enemy matrix, A/B-test numeric changes, deliver data report to main + suggestions/winners via PR. For the new card-and-dice combat use /combat-tuning.
---

You are invoked under the `legacy-combat-tuning` skill — run one tuning tick
end-to-end for the **legacy turn-based combat** (`resolveCombatRound`; the new
Hazard-Pattern Combat has its own tuner, `/combat-tuning`). Read
`skills/legacy-combat-tuning.md` in full before doing anything
else; it describes the matrix run, the A/B + verify gate, the hard guardrails
(numeric-only, ±25%/run, registry-allow-listed, never touch locked contracts),
and the two-track delivery.

Two-track delivery: the data report (facts) is pushed to `main`; the
suggestions writeup + any auto-applied A/B winners ride a new branch with a PR
opened for review. Never auto-merge that PR.

Arguments are forwarded to `npm run tune` (`--focus`, `--runs`, `--levels`,
`--playstyles`, `--difficulties`, `--max-iterations`).

When invoked under `/loop`, the user is not present. Return cleanly after the
tick completes.

Argument: $ARGUMENTS
