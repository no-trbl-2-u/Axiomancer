# Phase 141 — Memoir inner tab: Effects

## Outcome

Implement the read-only **Effects** inner tab inside Memoir.

The tab records effects the player understands and effects the player has encountered but does not yet understand. It must use collapsible/expandable sections and rows:

- `KNOWN` section — collapsible
- `UNKNOWN` section — collapsible
- each effect row is an accordion item
- collapsed row shows only effect icon + effect name, or `???` for unknown
- expanded row shows what the effect does and what causes it / caused it

## Source / user decision

T direct steering, 2026-06-19:

> Effects will have "known" and "unknown" effects and what you can do to cause them or what has caused them to you. "known" will include the starting effects (like the effects that happen on basic actions), effects from skills, and effects you've been effected by. This will be an accordion that will only have the name and the icon for the effect. Then when clicked, it'll expand to show what the effect does and what causes it.

Clarifications:

- The tabs are **read-only for now**.
- Unknown effects render as `???`.
- Known effects include **only effects the player can currently cause and effects the player has come across**.
- The Known and Unknown sections themselves must be collapsible/expandable.

## Dependency

Depends on Phase 138 shipping the Memoir inner-tab scaffold.

## Current state to start from

Likely sources to audit:

- `effectsLibrary`, `lookupEffect`, `applyEffect` from `axiomancer-mechanics`
- current player `effects`
- combat action/basic action effect events
- known skills / currently available skills
- equipment passive/on-hit/on-defend effects if the player can currently cause them
- recent combat/event ring buffer `_recentEvents` if it contains effect applications
- existing effect tooltip/content logic in:
  - `app/(tabs)/character/index.tsx`
  - `components/combat/CombatPlayerHud.tsx`
  - `components/combat/CombatEnemyPanel.tsx`
  - `state/presenters/tooltip.engine.ts`

## Decisions made upfront — DO NOT ASK

- Do not show the full engine effects library by default.
- Known effects are limited to:
  - starting/basic-action effects the player can currently cause;
  - effects from currently known/available skills;
  - effects the player has been affected by;
  - effects caused by currently equipped gear only if current state can prove the player can cause them.
- Unknown effects are encountered/foreshadowed records whose identity should not yet be revealed; display name is exactly `???`.
- Unknown rows may show vague cause text only if a real source exists, e.g. “Something in combat did this to you.” Do not reveal effect mechanics.
- Section collapse state and row expansion state are local UI state.
- Rows are read-only accordions, not buttons that apply effects.
- Use existing effect icon/chip vocabulary where available; if no icon system exists, use a stable glyph/category chip as the icon placeholder.
- Do not add new mechanics effect discovery rules in mobile unless the necessary source events already exist.

## Implementation units

1. **Effect-source audit**
   - Files likely involved:
     - `state/presenters/memoir.engine.ts`
     - `state/presenters/tooltip.engine.ts`
     - `state/selectors/combat-skills.ts`
     - `components/combat/*`
     - `app/(tabs)/character/index.tsx`
   - Determine which effects the player can currently cause from basic actions and known skills.
   - Determine which encountered effects can be read from current player/enemy state or recent events.
   - If persistent “seen effect” state does not exist, document the limitation and use current-state/recent-event visibility only for this phase.

2. **Presenter model**
   - File: `state/presenters/memoir.engine.ts`
   - Add `effects` VM section with:
     - tab title `EFFECTS`
     - description/subline
     - `known` rows
     - `unknown` rows
     - empty states for both sections
   - Each known row should include:
     - stable id
     - display name
     - icon/category key
     - description/effect text
     - causes: array of human-readable sources, e.g. `Basic action: Defend`, `Skill: X`, `You suffered this in combat`
   - Each unknown row should include:
     - stable id
     - display name `???`
     - icon/category key, likely mystery
     - vague cause text if available
     - no revealed effect mechanics

3. **Accordion UI**
   - File: `app/(tabs)/memoir/index.tsx`
   - Render Effects body only when `EFFECTS` is selected.
   - Add collapsible `KNOWN` and `UNKNOWN` section headers.
   - Inside each section, render accordion rows.
   - Collapsed row: icon + name only.
   - Expanded known row: what it does + causes.
   - Expanded unknown row: `???` + vague cause, no mechanics reveal.
   - Accessibility: rows expose expanded/collapsed state.

4. **Tests**
   - Extend `state/e2e/memoir.engine.test.ts`.
   - Add component/screen coverage for the accordion behavior.
   - Required assertions:
     - Effects tab exists and is selectable;
     - Known and Unknown sections can collapse/expand;
     - collapsed known row shows icon + name only;
     - expanded known row shows description + causes;
     - unknown row shows `???`;
     - unknown expanded row does not reveal mechanics;
     - known list does not include every effect in `effectsLibrary` by default;
     - no action/apply buttons render.

## Verification gate

Run:

```bash
npm run typecheck
npm test -- --runInBand state/e2e/memoir.engine.test.ts state/presenters/tooltip.engine.test.ts
npm run verify
```

If visual smoke is available, capture the Memoir route with `EFFECTS` selected and one known row expanded.

## Commit body template

```text
Phase 141 — Memoir inner tab: Effects

- add read-only Effects tab to Memoir
- split effects into collapsible Known and Unknown sections
- render effect rows as accordions with icon/name collapsed state
- show known effect descriptions and causes only when expanded
- render unknown effects as ??? without mechanics leakage
- limit known effects to current player-caused or encountered effects

Verification:
- npm run typecheck
- npm test -- --runInBand state/e2e/memoir.engine.test.ts state/presenters/tooltip.engine.test.ts
- npm run verify
```

## Definition of Done

- Effects tab is selectable from Memoir.
- Known and Unknown sections are collapsible/expandable.
- Effect rows are accordion rows.
- Known collapsed rows show only icon + name.
- Known expanded rows show what the effect does and what causes it.
- Unknown rows show `???` and do not leak mechanics.
- Known effects are scoped to current-causeable or encountered effects, not the whole library.
- Tests and `npm run verify` are green.

## Follow-ups out of scope

- Persistent long-term effect discovery state if the engine/mobile store does not already provide it.
- Applying effects from Memoir.
- Full bestiary/codex integration.
- New mechanics effect rules.
