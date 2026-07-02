# Phase 96 — Combat UX legibility overhaul (design-first)

## Outcome

**Design phase (no shipped-code edits):** Produce a combat-UX design brief clarifying iconography, terminology, and information hierarchy for the unclear numbers / icons players flagged. Addresses AUDIT [4.5] Combat UX unintuitive + playtest findings [F02-F06].

## Why

User-jot critique and playtest reports identified that combat modal provides poor UX with unclear numbers and icons. Players see symbols but don't understand meaning. This is a design problem requiring a design solution before code changes.

## Surface / Routes

**No route changes.** This phase produces design documentation only.

## Design inputs

- Current combat screen at `app/(tabs)/combat.tsx` and `components/combat/`
- AUDIT [4.5] Combat UX unintuitive findings
- PLAYTEST_REPORT.md findings:
  - [F02] encounter jargon unclear
  - [F04] battle log ability names confusing
  - [F05] LET phase numbers meaningless
  - [F06] CRUCIBLE symbols incomprehensible
- Existing theme tokens in `theme/axm.ts`
- Current presenter contract in `state/presenters/combat.engine.ts`

## Design deliverable

`design/combat-ux-overhaul.md` containing:

### 1. Terminology clarification
- Standardized combat vocabulary for all UI labels
- Clear mapping of engine terms to player-friendly names
- Glossary of key combat concepts with brief explanations

### 2. Iconography system
- Standardized icon meanings for all combat symbols
- Clear visual hierarchy for different information types
- Accessibility considerations for icon comprehension

### 3. Information hierarchy
- Clear prioritization of what information matters most to players
- Visual grouping of related information
- Reduced cognitive load through better organization

### 4. Specific fixes for playtest findings
- [F02] Encounter jargon → player-friendly terminology
- [F04] Battle log ability names → clear, consistent naming
- [F05] LET phase numbers → meaningful progress indicators
- [F06] CRUCIBLE symbols → comprehensible iconography

### 5. Layout recommendations
- Improved spacing and grouping of combat elements
- Better visual relationships between related UI components
- Clear action-to-feedback loops for player understanding

## Content / data reads

**None.** Design phase only.

## Components / handlers

**None created.** Design phase documents the intended changes for future implementation phases.

## Cross-links

**None.** Design documentation only.

## SEO / metadata

**Not applicable.** Design phase.

## Hero / body / sub-section composition

**Design documentation structure:**
- Executive summary of UX problems
- Detailed design solutions by category
- Implementation guidance for future phases

## Empty / loading / error states

**Not applicable.** Design phase.

## Decisions made upfront — DO NOT ASK

1. **Design-first approach:** This phase produces documentation only, no code changes. Implementation follows in subsequent phases.

2. **Scope limitation:** Focus strictly on legibility and comprehension issues identified in AUDIT [4.5] and playtest findings [F02-F06]. Do not expand to general combat redesign.

3. **Preserve existing functionality:** Design improvements must maintain all current combat mechanics and flows. No feature removal or fundamental behavior changes.

4. **Theme token compliance:** All design recommendations must use existing `theme/axm.ts` tokens. No new color palette or typography.

5. **Presenter contract preservation:** Design must work within existing `combat.engine.ts` presenter structure. No presenter refactoring required.

6. **Accessibility priority:** All iconography and terminology changes must improve accessibility and comprehension for new players.

7. **Implementation phases:** The design will inform 2-3 follow-up implementation phases focusing on different combat UI areas.

## Mobile reflow / responsive / paginate / output limits

**Not applicable.** Design phase documents responsive considerations for implementation phases.

## Pages × tests matrix

**Not applicable.** Design documentation only.

## Verify gate

**Not applicable.** Design phase produces documentation, not code.

## Commit body template

```
design: combat UX legibility overhaul brief — phase 96

- Documented terminology clarification for combat vocabulary
- Standardized iconography system for combat symbols
- Defined information hierarchy for better player comprehension
- Addressed playtest findings [F02-F06] encounter/battle UX issues
- Provided implementation guidance for follow-up phases

Decisions:
- Design-first approach: documentation only, no code changes
- Scope limited to legibility issues from AUDIT [4.5] and playtest findings
- Preserved existing functionality and presenter contract
- Maintained theme token compliance for future implementation
```

## DoD

- [ ] `design/combat-ux-overhaul.md` created with all sections above
- [ ] Terminology clarification addressing playtest jargon issues [F02, F04]
- [ ] Iconography system clarifying CRUCIBLE symbols [F06] and other icons
- [ ] Information hierarchy addressing LET phase numbers [F05] confusion
- [ ] Implementation guidance for future code-change phases
- [ ] Phase 96 row marked `[x]` in `plan/steps/01_build_plan.md`

## Follow-ups (out of scope)

1. **Phase 97** — Combat terminology implementation (code changes based on design)
2. **Phase 98** — Combat iconography implementation (visual symbol updates)
3. **Phase 99** — Combat information hierarchy implementation (layout improvements)
4. Future playtest validation of design improvements