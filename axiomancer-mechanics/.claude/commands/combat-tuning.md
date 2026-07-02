---
description: Hazard-Pattern Combat balance loop (HP-only win model) — drive the Monte-Carlo sim (greedy + blind) across enemies/seeds, A/B numeric changes to the HP/threat/Conviction economy, deliver report + suggestions/changes via PR. For the legacy turn-based combat use /legacy-combat-tuning.
---

You are invoked under the `combat-tuning` skill — run one tuning tick
end-to-end for the **Hazard-Pattern Combat** (the card-and-dice driver,
`resolveThreatPhase` / `playCombatCard`; the legacy turn-based combat has its
own tuner, `/legacy-combat-tuning`). Read `skills/combat-tuning.md` in full
before doing anything else; it describes the sim-evidence matrix
(`simulateHazardPatternCombat`, run under BOTH the `greedy` and `blind`
policies, plus the `npm run combat-sim` CLI), the design targets, the verify
gate, the tunable surface (the constants in `src/Combat/combat.{threat,
threat-sequences,engine,cards,dice,signature,deck}.ts` + authored threat
sequences — numeric only; the impact formula / RPS read / GUARD soak / mercy
gate / Conviction accounting are propose-only), and the one-PR delivery.

North star: the enemy's SOLE bar is HP and dropping it to 0 is the only win
condition — status effects are the EFFICIENT path there. Tune so status BEATS
basic attacks (a DoT loadout out-performs a pure-strike loadout, decisively on
bosses), status engagement stays high, the Befriend mercy path stays live, and
no single card dominates (anti-spam, Spec 26b §3). The old two-Pressure-Track
win model (DoT Erosion + Control Saturation) was REMOVED on 2026-06-22 — do not
tune the vestigial `dotFactor`/`controlFactor` fields.

Deliver everything on ONE new branch + PR, ready for review. Never push to
`main`. Never auto-merge.

When invoked under `/loop`, the user is not present. Return cleanly after the
tick completes.

Argument: $ARGUMENTS
