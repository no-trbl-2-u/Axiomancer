# Phase 110 — Boss Befriend faction reputation tradeoff

> For `/march`: run after Phase 108, and preferably after Phase 109 if the first region boss/elite chain is being used as the proving ground.

## Goal

Make boss Befriend outcomes alter faction reputation: sparing/befriending a boss in one region costs reputation with one faction and gains reputation with another.

## Source doctrine

Read before implementation:

- `VISION.md`
- `docs/adr/ADR-0007-befriend-is-heart-skill-with-mercy-choice.md`
- `~/Workspace/decisions/CDR-0005-axiomancer-befriend-skill-and-mercy-choice.md`

## Required behavior

- Boss Befriend/spare outcomes can apply faction reputation deltas.
- At least one authored boss outcome demonstrates lose-with-one / gain-with-another behavior.
- Reports or combat-end output expose the reputation change clearly enough for mobile to consume later.

## Non-goals

Do not build a full faction UI. Do not create a large faction simulation. Do not author every region's faction politics unless T approves the content pass.

## Implementation tasks

1. Inspect existing alignment/reputation/world-flag structures before adding new state.
2. Add the smallest durable faction reputation state shape needed.
3. Add pure helpers for applying faction reputation deltas.
4. Add hermetic tests for clamp/range/update behavior.
5. Extend boss friendship reward/outcome data with reputation deltas.
6. Author the first boss tradeoff.
7. Surface the delta in combat-end report or game events.
8. Add hermetic tests for a boss Befriend outcome applying both loss and gain.
9. Update docs/API references.

## Verification

- `npm test`
- `npm run type-check`
- `npm run playtest`
- `npm run verify`

## Definition of done

- Boss Befriend can alter faction reputation.
- One faction loss and one faction gain are proven in tests.
- Output is available for CLI/mobile consumption.
- The mechanic remains consequence-bearing, not reward-only mercy.
