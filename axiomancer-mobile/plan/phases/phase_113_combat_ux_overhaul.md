# Phase 113 — Combat UX overhaul (design implementation)

## Outcome

Implement the combat UX direction in `design/combat-ux-overhaul-prompt.md` and `design/combat-ux-overhaul.md` to make numbers/icons legible and the choice→outcome flow decodable for first-time players, while preserving the existing aesthetic language and engine-owned mechanical depth.

## Why

The AUDIT [4.5] "Combat UX unintuitive" finding and playtest feedback [F02-F06] identified that first-time players struggle to understand combat mechanics. Numbers and icons lack meaning, the flow between player choices and outcomes is opaque, and several surfaces show information that new players cannot decode. The game's literary voice and dark aesthetic are working beautifully, but combat's mechanical layer is failing to communicate tactical information effectively.

## Scope

### Combat terminology updates

Replace engine jargon with player-friendly terms in all combat presenters:
- `choosingStance` → "Choose a Stance"
- `choosingAction` → "Your Move"  
- `choosingSkill` → "Select Technique"
- `resolving` → "Strike Unfolds"
- "LET IT FALL" → "COMMIT"
- "CRUCIBLE" → "TECHNIQUES"

### Stance card layout improvements

Fix Problem 1: stance cards clipping on narrow viewports (375pt iPhone SE). Ensure all three stance cards (HEART/BODY/MIND) display legibly with triangle relationships ("BEATS X -- WEAK Y") and ATK/SKL/DEF stats visible.

### CRUCIBLE resource display clarity

Fix Problem 2: replace cryptic unicode glyphs with readable resource labels. Add color coding and clear indication of which resources specific skills consume.

### Battle log comprehension

Fix Problem 3: improve battle log entries to better connect player choice to mechanical outcome. Maintain compact format and existing color coding while making effect names more understandable.

### LET phase resolution clarity

Fix Problem 4: transform resolution display from raw numbers to understandable progression. Show what the numbers represent and why the outcome occurred.

### Encounter modal jargon fixes

Fix Problem 5: add decode layer for technical terms ("ii -- lx vitae -- adv. unknown" / "-ii morale") using existing TapTooltip system while preserving lore text.

### Morale visibility

Fix Problem 6: Add morale indicator to exploration screen or SELF tab, and implement brief narrative feedback after fleeing.

## Routes / API endpoints / CLI surface

No new routes. All changes are within existing combat modal system and related UI components.

## Content / data reads

No new content reads. Updates to existing presenter logic and UI component rendering.

| Helper | Call | Use |
|--------|------|-----|
| `useCombatStore()` | Combat state access | UI state and action handling |
| `useGameStore()` | Game state access | Player stats and morale |

## Components / handlers

**Modified components:**
- `CombatModal` — main combat interface container
- Stance selection cards — layout and responsive fixes
- Resource display panels — CRUCIBLE → TECHNIQUES clarity
- Battle log components — entry format improvements
- Resolution display — LET phase number clarity
- Encounter modal — jargon decode tooltips
- Player info displays — morale indicator addition

**New primitives:**
- Resource labels/tooltips for technique costs
- Enhanced battle log entry format
- Improved resolution number presentation
- TapTooltip decode layer for encounter terms

**Reused:**
- Existing dark aesthetic tokens and fonts
- Current TapTooltip system for decode layer
- Established color coding (blood/sulfur/rust/bone)

## Cross-links

**In (verify):**
- Combat modal launches from exploration encounters
- All stance/action/skill selection flows work correctly
- Battle log integrates with combat engine events
- Morale display reflects game state changes

**Out (ship):**
- Improved combat legibility for new players
- Responsive stance cards on narrow viewports
- Clear resource cost indicators
- Understandable battle progression
- Decoded encounter modal terms

**Retro-fit:**
- Morale indicator added to exploration or SELF tab
- Enhanced tooltips throughout combat flow

## SEO / metadata / output schema

N/A (internal game interface improvements)

## Hero / body / sub-section composition

Combat Modal structure (preserved):
- Enemy panel (top)
- Scrollable battle log (middle)  
- Player action area (bottom)
- Phase progression indicators

Key layout improvements:
- Stance cards: responsive three-card layout that fits 375pt viewport
- Resource panel: labeled TECHNIQUES with clear cost indicators
- Battle log: enhanced entry format connecting choice to outcome
- Resolution area: visual progression instead of raw numbers

## Empty / loading / error states

Preserve existing combat state handling. No new empty states required.

## Decisions made upfront — DO NOT ASK

- **Preserve existing aesthetic** — All changes use current fonts (Pirata One headers, IM Fell English body, Bebas Neue labels) and color tokens from `theme/axm.ts`
- **Engine terminology stays in code** — Translation happens only at presentation layer, no engine contract changes
- **TapTooltip system for decode** — Use existing tooltip infrastructure for encounter modal jargon translation
- **Three-panel layout preserved** — Keep current combat modal structure, improve within constraints
- **No local mechanics simulation** — All combat logic remains engine-owned, UI changes are presentation-only
- **Morale on SELF tab** — Place morale indicator in SELF tab alongside existing stats rather than cluttering exploration screen

## Mobile reflow / responsive / paginate / output limits

Critical responsive fix for 375pt viewports:
- Stance cards must be legible on iPhone SE width
- Touch targets maintain 44pt minimum for accessibility
- Resource panels adapt to narrow screens
- Battle log remains scrollable and compact

## Pages × tests matrix

| Component | Unit test | Integration | E2E |
|-----------|-----------|-------------|-----|
| Combat stance cards | Yes | Via combat modal | Via encounter flow |
| Resource display | Yes | Via technique selection | Via skill usage |
| Battle log formatting | Yes | Via combat events | Via full combat |
| Resolution display | Yes | Via LET phase | Via round completion |
| Encounter tooltips | Yes | Via encounter modal | Via FIGHT/FLEE |

## Verify gate

- `npm run typecheck` (TypeScript)
- `npm test` (Jest + RTL focused on combat presenters)
- `npm run lint` (ESLint)
- `npm run verify` (full test suite)
- Visual evidence via `npm run verify:visual` or exact visual-smoke blocker
- Combat flow usability on 375pt viewport

## Commit body template

```
feat: combat UX overhaul (design implementation) — phase 113

- Stance cards responsive layout for narrow viewports
- CRUCIBLE → TECHNIQUES with clear resource labels
- Battle log entries connect player choice to outcome
- LET phase resolution shows meaningful progression
- Encounter modal jargon decode via TapTooltips
- Morale indicator added to SELF tab with flee feedback
- Player-friendly terminology replaces engine jargon

Decisions:
- TapTooltip system chosen for encounter decode layer
- Morale indicator placed on SELF tab to avoid exploration clutter
- Engine terminology preserved in code, translated at presentation
- Three-panel combat layout structure maintained
- Existing aesthetic tokens and fonts preserved throughout

Closes #[ISSUE_NUMBER]
```

## DoD

- [x] Stance cards display legibly on 375pt viewport
- [x] CRUCIBLE renamed to TECHNIQUES with resource labels
- [x] Battle log format improved for choice-outcome clarity  
- [x] LET phase numbers replaced with meaningful display
- [x] Encounter modal terms decodable via TapTooltips
- [x] Morale indicator visible on SELF tab
- [x] Flee action provides narrative feedback
- [x] Player-friendly terminology throughout combat
- [x] TypeScript passes
- [x] Combat presenter tests pass
- [x] Visual verification completed
- [x] 375pt viewport usability confirmed

## Follow-ups (out of scope)

- Additional combat tutorial for new players (separate UX initiative)
- Engine-side balance adjustments based on improved visibility  
- Advanced combat analytics for power users
- Combat accessibility enhancements beyond current WCAG baseline