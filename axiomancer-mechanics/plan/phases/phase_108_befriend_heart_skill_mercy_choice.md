# Phase 108 — Befriend heart skill and mercy choice

> For `/march`: implement mechanics truth first. Mobile modal work is gated on this phase's engine state/action contract.

## Goal

Replace the passive friendship-only path with an explicit **Befriend** heart skill and a post-success mercy choice.

## Source doctrine

Read before implementation:

- `VISION.md`
- `docs/adr/ADR-0007-befriend-is-heart-skill-with-mercy-choice.md`
- `~/Workspace/decisions/CDR-0005-axiomancer-befriend-skill-and-mercy-choice.md`
- `automation/playtest/BALANCE_LEDGER.md`

## Required behavior

- Keep the HP gate.
- Every player starts with Befriend.
- Befriend is heart-based.
- Befriend requires 5 heart tokens to attempt.
- Successful Befriend opens a choice state instead of immediately ending combat:
  - spare / befriend / preserve the enemy;
  - exploit the opening for a free guaranteed critical attack.
- CLI must expose the choice.
- Reports/playtests must distinguish Befriend attempts, spare outcomes, exploit outcomes, and timeouts.

## Non-goals

Do not implement the regional anti-exploit rules in this phase. Do not implement faction reputation in this phase. Do not rewrite all boss rites.

## Implementation tasks

1. Add or adapt Befriend as a known starting skill.
2. Add hermetic tests proving new characters know Befriend.
3. Add the 5-heart eligibility/cost rule.
4. Add hermetic tests for insufficient heart, sufficient heart, and HP gate failure.
5. Add a combat state/action/report shape for the mercy choice.
6. Add hermetic tests for successful Befriend opening the choice state.
7. Implement spare/befriend resolution from the choice state.
8. Implement exploit/free-critical resolution from the choice state.
9. Add CLI prompt handling for the two choices.
10. Update playtest policy/report metrics to record attempts and outcomes.
11. Update docs and API references.

## Verification

- `npm test`
- `npm run type-check`
- `npm run playtest`
- `npm run verify`

## Definition of done

- Befriend exists as a starting heart skill.
- 5-heart attempt rule is tested.
- HP gate remains tested.
- Successful Befriend opens a choice state.
- Spare and exploit branches both work and are tested.
- CLI can make the choice.
- Playtest/report output can show whether STRATEGIST is failing from balance, policy, or mechanics.
