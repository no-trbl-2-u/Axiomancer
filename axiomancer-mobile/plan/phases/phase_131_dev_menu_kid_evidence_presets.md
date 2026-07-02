# Phase 131 — Dev menu Kid evidence presets

## Source

T accepted the Kid playthrough matrix direction on 2026-06-16 and corrected the player-tier ladder: the dev menu should support evidence-grade mobile playthrough setup at **L1, L15, L30, and L50**, with level-relevant skills/equipment. T also requested an **add item by id** dev control.

This phase makes the DEV menu a reproducible test range for the Kid's Hazard / Gathering / Combat rotation. It is not a balance phase.

## Goal

Give the Kid deterministic mobile setup controls so daily playthrough reports can show real matrix counts instead of anecdotal random-state scouting.

## Scope

1. Add player-tier preset controls.
   - Replace or extend the current `FRESH START` / `ENDGAME` debug presets with explicit buttons or a compact picker for:
     - `L1`
     - `L15`
     - `L30`
     - `L50`
   - Each preset must seed level-appropriate stats, known skills, combat resources/loadout expectations if still required by mobile, and equipment relevant to that level.
   - Do not use empty/irrelevant equipment at high tiers. The preset must be useful for combat and encounter evidence.
   - Preserve engine-owned terms and state shape; do not locally invent mechanics formulas.

2. Add item-by-id injection.
   - Add a dev-only control to enter or select an item id and add that item to the player's inventory.
   - Validate unknown ids gracefully with visible feedback.
   - Prefer mechanics item/template truth where available; do not create local fake items.
   - Record enough UI/test feedback that the Kid can tell whether the item was added.

3. Add deterministic Hazard evidence setup.
   - Add selectable hazard deck presets for Kid matrix cells:
     - starter baseline/control
     - early straightforward
     - late straightforward
     - early enchantment
     - late enchantment
     - early utility
     - late utility
   - Keep random `SHUFFLE FATE`, but label it as random variety, not evidence-grade.
   - Add seed and hazard-id controls or fixed buttons if the current state/action layer supports them.
   - Preserve the existing direct Hazard trigger path.

4. Add deterministic Gathering / Combat setup where mobile already has hooks.
   - Gathering: seed/site or closest deterministic setup available; if missing, expose the exact harness gap rather than faking it.
   - Combat: enemy/difficulty selector or current-map low/mid/high foe controls where mechanics truth allows it.

5. Keep production/player flow untouched.
   - Dev controls remain behind `isDevToolsEnabled()` / build-profile gating.
   - No balance numbers change.
   - No live player UI depends on these controls.

## Decisions made upfront — DO NOT ASK

- Player tier buttons are exactly `L1`, `L15`, `L30`, `L50`.
- The high-tier presets must include relevant skills and equipment; naked stat-only presets do not satisfy the phase.
- `Add item by id` is dev-only and may be plain text input plus button if a richer picker is too large.
- If mechanics exports do not expose a needed item/deck helper, document the exact export blocker and implement only the safe subset.

## Non-goals

- Do not rebalance combat, items, Hazard, or Gathering.
- Do not change live progression rewards.
- Do not move the dev menu into a tab here; Phase 132 owns that extraction.
- Do not remove existing dev buttons yet. T will perform a visual audit after these phases.

## Acceptance criteria

- [ ] Dev UI exposes `L1`, `L15`, `L30`, and `L50` player presets.
- [ ] Each preset seeds level-relevant skills and equipment, not merely level/stat numbers.
- [ ] A dev-only `add item by id` control adds a valid mechanics item/template to inventory and shows graceful feedback for invalid ids.
- [ ] Hazard deck preset controls exist for starter, early/late straightforward, early/late enchantment, and early/late utility.
- [ ] Random Hazard deck shuffle remains available but is visually distinguished from deterministic evidence presets.
- [ ] Seed/hazard-id controls are added where current actions/hooks support them, or exact missing hooks are documented as follow-up gaps.
- [ ] Gathering/Combat setup controls are improved where current mechanics/mobile hooks support deterministic evidence.
- [ ] Controls remain dev-only.
- [ ] Focused component/store/presenter tests cover player presets, item-by-id success/failure, and at least one Hazard deck preset.

## Verification

Run:

- focused dev-menu preset tests
- focused inventory/item-by-id tests
- focused Hazard deck preset tests
- `npm run typecheck`
- `npm run verify`
- `npm run verify:visual` or an exact visual-smoke blocker

## Definition of Done

The Kid can start a mobile evidence run from reproducible L1/L15/L30/L50 states, add a specific item by id, and select deterministic Hazard deck presets without changing production player flow.

## Commit body template

```text
Phase 131 — Dev menu Kid evidence presets

- added L1/L15/L30/L50 dev presets with level-relevant skills/equipment
- added dev-only item-by-id inventory injection with invalid-id feedback
- added deterministic Hazard deck preset controls for Kid evidence matrices
- preserved production gating; no balance changes

Verification:
- <commands/results>
```

## Follow-ups out of scope

- Visual pruning of dev buttons after T's audit.
- Moving the dev menu into a tab (Phase 132).
- Mechanics exports for item/deck helpers if this phase exposes a contract gap.
