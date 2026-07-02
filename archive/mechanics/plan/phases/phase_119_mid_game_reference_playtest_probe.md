# Phase 119 — Mid-game reference playtest probe (Phase 104 coverage gap)

> Add the missing northern-forest/midgame measurement surface between the early and endgame probes.

## Outcome

A repeatable mid-game reference probe measures a level-6 Wanderer against northern-forest elite-tier enemies. It reports rounds-to-resolve, survivability, resource routing, skill use, and friendship/mercy opportunity signals in the same spirit as the Phase 104 probes.

## Source

Promoted from `plan/PHASE_CANDIDATES.md` on 2026-06-05 by T's direct oversight order: "Promote 5, 4, and 1."

Candidate signal: Phase 104 shipped early-game and endgame probes, but no direct midgame/northern-forest probe. Roster-wide tuning can proceed without it, but this fills the evidentiary gap before future balance judgment.

## Scope

### Unit 1 — Probe script

**Files:**
- `automation/playtest/mid-game-reference-probe.mjs` or the current Phase 104 probe directory/pattern if naming differs

Author a deterministic probe using a level-6 Wanderer-style player state with Tier 2 skills available against 3-4 northern-forest elite-tier enemies. Capture:
- outcome counts
- rounds-to-resolve
- player survivability / HP loss
- resource generation and skill-use routing
- friendship/mercy opportunity and resolution signals where applicable

Follow the Phase 104 script/report style rather than inventing a new format.

### Unit 2 — Integration + docs

**Files:**
- `automation/playtest/README.md`
- `docs/testing.md` or `docs/playtest.md` if that is the current playtest inventory
- `CHANGELOG.md` `[unreleased]`

Document when to run the mid-game probe and how to interpret its signal relative to early/endgame probes.

## Decisions made upfront — DO NOT ASK

- **D1 — Measurement only.** Do not tune enemy/player parameters in this phase unless a test must be adjusted to run the probe at all.
- **D2 — Use existing content.** Use authored northern-forest enemies; do not create new enemies.
- **D3 — Match Phase 104 evidence shape.** No bespoke report schema unless Phase 104 machinery requires a small extension.
- **D4 — No mobile coupling.** This is engine/playtest evidence only.

## Verify gate

- Focused mid-game probe command added by the phase
- `npm run playtest`
- `npm run type-check`
- `npm test`
- `npm run build`

## Acceptance

- Mid-game probe runs deterministically.
- Probe report includes outcome, rounds, survivability, resource, skill, and friendship/mercy signals.
- Playtest docs list the probe beside early/endgame reference probes.
