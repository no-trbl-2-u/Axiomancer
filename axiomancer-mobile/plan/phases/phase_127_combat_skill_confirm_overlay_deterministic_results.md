# Phase 127 — Combat skill confirmation overlay and deterministic skill result UI

## Source

T accepted the combat UX correction on 2026-06-15: player skills always hit, and their damage/effects are static, so mobile should not show a dice-roll tracker on skill use. T also directed that selecting a skill should open a detail popup with `Confirm` and `Cancel` controls before the skill is committed.

Mechanics companion phase: Phase 150 adds an enemy skill response when the player uses a skill.

## Goal

Make skill use legible as deterministic doctrine plus consequence. The player should see what a skill does, confirm the commitment, and then watch the guaranteed skill result and any enemy skill answer — not a fake roll ritual.

## Scope

1. Remove dice-roll tracker presentation from player skill use.
   - Do not show attack-roll / hit-roll / dice tracker UI for deterministic skills.
   - Preserve roll UI only for actions that genuinely roll or contest through mechanics truth.

2. Add skill-selection detail popup.
   - Tapping/selecting a skill opens an overlay/modal before commitment.
   - The overlay shows skill name, cost, current affordability, deterministic damage/effects/statuses, keyword text, and relevant targeting/stance/resource notes available from engine/presenter truth.
   - Include two explicit controls: `Confirm` and `Cancel`.
   - `Confirm` commits the skill action through the existing mechanics-backed combat action path.
   - `Cancel` closes the overlay and returns to action selection without side effects.

3. Show deterministic result feedback after confirmation.
   - Render skill name, cost paid, guaranteed damage/effects applied, and battle-log entry.
   - When mechanics Phase 150 is available, surface the enemy skill answer distinctly from an ordinary enemy action if engine events expose it.

4. Preserve mobile thin-client law.
   - Do not calculate skill hit chance locally.
   - Do not simulate damage/effects locally beyond already-approved presenter projection fields.
   - If engine/presenter lacks a field for a detail, show a graceful omission or file the exact mechanics/mobile contract blocker.

## Non-goals

- Do not rebalance skill costs or effects.
- Do not change mechanics skill accuracy or outcome rules.
- Do not remove dice/roll UI from non-skill actions that genuinely roll.
- Do not implement enemy response mechanics locally.

## Acceptance criteria

- [ ] Selecting a combat skill opens a detail overlay before action commitment.
- [ ] Overlay includes skill details plus explicit `Confirm` and `Cancel` buttons.
- [ ] `Cancel` produces no combat action and returns to the prior action-selection state.
- [ ] `Confirm` commits the skill through the existing engine-backed action path.
- [ ] Player skill use no longer displays a dice-roll tracker / hit-roll UI.
- [ ] Deterministic skill result feedback shows applied damage/effects/statuses from mechanics/presenter truth.
- [ ] Enemy skill answer can be rendered distinctly when the mechanics event contract exposes it; otherwise the phase documents the exact blocked field.
- [ ] Focused Jest/component or presenter tests cover overlay open/cancel/confirm, no-roll skill rendering, and result feedback.
- [ ] Visual-smoke evidence is updated or an exact visual blocker is recorded.

## Verification

Run:

- focused combat skill overlay Jest/component tests
- `npm run typecheck`
- `npm run verify`
- `npm run verify:visual` or exact visual-smoke blocker

If current mechanics package lacks the Phase 150 event detail, ship the deterministic no-roll and confirm overlay work with a documented integration blocker for the enemy-response display.
