# Phase 162 — Hazard-style combat tuning audit

**Goal:** Audit the live combat tuning surface against the new Hazard-style
combat baseline, then produce a concrete retuning plan that keeps combat
status-centered, card/dice-readable, and empirically measurable before any
new numeric tuning tick runs.

**Source:** T direct steering 2026-06-23: "Create a phase in mechanics to
audit the combat tuning to fit into the new hazard style combat." Builds on
Spec 25 Hazard-Pattern Combat, Spec 26 / 26b combat-depth work, and the
current `skills/combat-tuning.md` win-model correction.

## Why this phase exists

The old roster-wide tuning loop judged classic attack/defend/skill combat
through resolution bands and per-policy win rates. The live combat system has
changed shape: stance dice, card hands, Signature Skills, Conviction economy,
enemy hidden stance reads, anti-spam/variety pressure, HP-only victory, and
status-effect payoffs now carry the design.

A blind `/combat-tuning` run can still change numbers, but without this audit
it may optimize stale witnesses or stale metrics. The audit must re-anchor the
tuning loop to Hazard-style combat rather than legacy attack-trading.

## Audit scope

1. **Tuning-surface inventory**
   - Walk `src/Combat/combat.*.ts`, `src/Tuning/**`, `docs/combat.md`,
     `docs/enemy.md`, `VISION.md`, and `skills/combat-tuning.md`.
   - List every combat tuning lever currently available: stance dice, card
     draw/hand/discard cadence, Signature Skill access, Conviction generation
     and spend, enemy skill answer rates, hidden-stance read odds, status
     thresholds, HP/damage scaling, anti-spam/variety bonuses, and threat
     pacing.
   - Classify each lever as data/content, tuning parameter, witness-policy
     behavior, or mechanics change requiring T approval.

2. **Metric/witness audit**
   - Inspect existing playtest/tuning witnesses and reports for legacy
     assumptions: attack/defend dominance, obsolete pressure-track language,
     stale status-engagement floors, or win-rate targets that ignore card/dice
     expression.
   - Define Hazard-style combat evidence fields: card choices made, dice spent
     by stance/color, Signature Skill usage, Conviction economy, read/answer
     events, status variety, status-to-advantage conversion, enemy response
     quality, and HP resolution.
   - Preserve the 65-75% aggregate actual-victory band only where it remains
     meaningful; explicitly separate tuning gates from expressiveness gates.

3. **Harness gap report**
   - Run the cheapest existing combat/tuning evidence commands available on
     current main, enough to prove what the harness can and cannot observe.
   - If the harness cannot expose the fields above, file concrete follow-up
     rows rather than guessing from incomplete reports.
   - Do not tune numbers in this phase unless a one-line stale-doc/test fix is
     necessary to make the audit truthful.

4. **Retuning doctrine output**
   - Update `skills/combat-tuning.md` and/or `docs/combat.md` only for settled
     audit truth: current baseline, valid metrics, invalid legacy assumptions,
     and lawful tuning levers.
   - Produce a short matrix: lever -> owned file -> evidence command -> expected
     effect -> risk.
   - End with the next recommended tuning phase(s), not vague advice.

## Decisions made upfront

- **Audit first, retune second.** This phase is not a numeric balance pass. It
  prepares the evidence law so later `/combat-tuning` runs do not optimize a
  dead combat model.
- **HP-only win model is live.** Do not resurrect the removed two-pressure-track
  win condition. Use pressure/threat language only where the current code still
  implements it.
- **Status effects remain the main fun.** A Hazard-style combat loop passes only
  if status use is visible, useful, and stronger than basic attack repetition.
- **Core mechanics stop rule.** Changes to action economy, card/dice rules,
  Signature Skill semantics, Conviction law, HP victory semantics, or status
  resolution rules require T approval and must be promoted separately.

## Commit units

1. `docs(combat): phase 162 audit hazard-style combat tuning surface`
   - Inventory live levers and stale assumptions.
   - Run/read the cheapest existing evidence commands and capture the harness
     visibility gaps.
   - Patch settled documentation/skill truth.

2. `phases: close phase 162 hazard-style combat tuning audit`
   - Update this brief and the build-plan row with audit verdict, commands run,
     and promoted follow-up phases if any.

## Verify gate / DoD

- [x] Live combat tuning levers inventoried and classified by authority layer.
      (Commit 08d804e — see commit body for full lever table.)
- [x] Legacy tuning assumptions identified and either retired or explicitly
      preserved with current-code evidence.
      (MED-1/MED-2/MED-3 patched; dotFactor/controlFactor vestigial fields
      explicitly noted in combat.threat.ts and are not tuning targets.)
- [x] Existing harness visibility tested with real commands; gaps recorded.
      (200-run matrix across 4 enemies × 3 loadouts × 2 policies — all 100%
      win rate; conviction gap fixed; GAP-2/GAP-3 promoted as follow-up.)
- [x] `skills/combat-tuning.md` and/or combat docs patched where they would
      otherwise mislead `/combat-tuning` or `/march`.
      (docs/combat.md + plan/bearings.md — 3 MED + 2 LOW legacy doc fixes.)
- [x] Next tuning phase(s) proposed as concrete build-plan rows if needed.
      (Phase 163 promoted: /combat-tuning boss-threat-damage pass.)
- [x] `git diff --check` green.
- [x] Targeted tests/docs checks run; `npm run verify` required if source or
      test code changes. (Only CLI + docs changed; type-check + lint green.)
