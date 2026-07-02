# Phase 103 — Befriend mercy-choice modal

> For `/march`: blocked until Axiomancer Mechanics ships the Befriend choice state/action/report contract, currently planned as Mechanics Phase 108.

## Goal

Present the engine-emitted Befriend mercy choice as a mobile modal.

## Source doctrine

Read before implementation:

- `VISION.md`
- `docs/adr/ADR-0007-befriend-mercy-choice-modal.md`
- `~/Workspace/decisions/CDR-0005-axiomancer-befriend-skill-and-mercy-choice.md`

## Required behavior

When mechanics emits the mercy-choice state, mobile presents two choices:

1. spare / befriend / preserve the enemy;
2. exploit the opening for a free guaranteed critical attack.

The exploit option must not read like a neutral attack button. It is temptation with consequence.

## Implementation tasks

1. Upgrade or consume the mechanics package version that exposes the mercy-choice contract.
2. Extend combat presenter/view-model shape for the modal.
3. Add hermetic presenter tests for modal visibility and text fields.
4. Build the modal component.
5. Wire spare/befriend choice dispatch.
6. Wire exploit/free-critical choice dispatch.
7. Add accessibility labels that expose consequence category.
8. Add component tests.
9. Update visual smoke/reference evidence if the modal is reachable in seeded flow.

## Verification

- `npm test`
- `npx tsc --noEmit`
- `npm run verify:visual` where applicable
- `npm run verify`

## Definition of done

- Mobile consumes engine truth and does not calculate eligibility locally.
- Modal presents both choices clearly.
- Accessibility labels are present.
- Tests prove rendering and dispatch.
